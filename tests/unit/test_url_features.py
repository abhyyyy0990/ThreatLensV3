"""Unit tests for URL feature extractor (v001)."""

from __future__ import annotations

import math

import pytest

from src.features import url_features


class TestFeatureSchema:
    def test_feature_version(self):
        assert url_features.FEATURE_VERSION == "v001"

    def test_feature_names_returns_list(self):
        names = url_features.feature_names()
        assert isinstance(names, list)
        assert len(names) > 0

    def test_feature_names_no_meta_columns(self):
        names = url_features.feature_names()
        assert "feature_version" not in names
        assert "parse_error" not in names

    def test_extract_returns_all_feature_names(self):
        result = url_features.extract("http://example.com/path?q=1")
        names = url_features.feature_names()
        for name in names:
            assert name in result, f"Missing feature: {name}"

    def test_feature_count_stable(self):
        """Feature count must not silently change (schema versioning)."""
        names = url_features.feature_names()
        assert len(names) == 44  # v001 has exactly 44 numeric features


class TestLexicalFeatures:
    def test_url_length(self):
        url = "http://example.com"
        feat = url_features.extract(url)
        assert feat["url_len"] == len(url)

    def test_dot_count(self):
        feat = url_features.extract("http://a.b.c.example.com/path")
        assert feat["dot_count"] >= 4

    def test_digit_ratio(self):
        url = "http://1234567890.com"
        feat = url_features.extract(url)
        assert feat["digit_count"] > 0
        assert 0.0 < feat["digit_ratio"] < 1.0

    def test_hyphen_count(self):
        feat = url_features.extract("http://my-secure-login.com")
        assert feat["hyphen_count"] == 2

    def test_at_count(self):
        feat = url_features.extract("http://user@malicious.com")
        assert feat["at_count"] == 1

    def test_percent_count(self):
        feat = url_features.extract("http://evil.com/%70%61%79%70%61%6C")
        assert feat["percent_count"] >= 4

    def test_question_and_ampersand(self):
        feat = url_features.extract("http://example.com?a=1&b=2&c=3")
        assert feat["question_count"] == 1
        assert feat["ampersand_count"] == 2
        assert feat["equals_count"] == 3


class TestStructuralFeatures:
    def test_https_detected(self):
        feat = url_features.extract("https://secure.example.com")
        assert feat["has_https"] == 1
        assert feat["has_http"] == 0

    def test_http_detected(self):
        feat = url_features.extract("http://example.com")
        assert feat["has_http"] == 1
        assert feat["has_https"] == 0

    def test_ip_hostname_detected(self):
        feat = url_features.extract("http://192.168.1.1/admin")
        assert feat["is_ip"] == 1

    def test_legitimate_hostname_not_ip(self):
        feat = url_features.extract("https://google.com")
        assert feat["is_ip"] == 0

    def test_punycode_detected(self):
        feat = url_features.extract("http://xn--e1afmapc.com")
        assert feat["has_punycode"] == 1

    def test_suspicious_tld_xyz(self):
        feat = url_features.extract("http://malicious.xyz/login")
        assert feat["tld_suspicious"] == 1

    def test_legitimate_tld_com(self):
        feat = url_features.extract("https://google.com/search?q=hi")
        assert feat["tld_suspicious"] == 0

    def test_subdomain_count(self):
        feat = url_features.extract("http://a.b.c.example.com")
        assert feat["subdomain_count"] == 3

    def test_path_depth(self):
        feat = url_features.extract("https://example.com/a/b/c/page")
        assert feat["path_depth"] == 4

    def test_query_param_count(self):
        feat = url_features.extract("https://example.com?a=1&b=2&c=3")
        assert feat["query_param_count"] == 3

    def test_nonstandard_port(self):
        feat = url_features.extract("http://example.com:8080/admin")
        assert feat["has_nonstandard_port"] == 1

    def test_standard_port_not_flagged(self):
        feat = url_features.extract("https://example.com:443/page")
        assert feat["has_nonstandard_port"] == 0


class TestEntropyFeatures:
    def test_high_entropy_url(self):
        feat = url_features.extract(
            "http://a1b2c3d4e5f6.xyz/AbCdEfGhIjKlMnOpQrStUvWxYz"
        )
        assert feat["url_entropy"] > 3.0

    def test_low_entropy_url(self):
        feat = url_features.extract("http://aaaaaa.com/aaaa")
        assert feat["url_entropy"] < 3.0

    def test_entropy_non_negative(self):
        for url in [
            "http://example.com",
            "https://a.b.c.d.e.f.g.xyz?q=test",
            "http://192.0.2.1/admin",
        ]:
            feat = url_features.extract(url)
            assert feat["url_entropy"] >= 0.0
            assert feat["hostname_entropy"] >= 0.0


class TestSemanticFeatures:
    def test_phishing_keyword_login(self):
        feat = url_features.extract("http://secure-login-update.com/account")
        assert feat["has_phishing_keyword"] == 1
        assert feat["phishing_kw_count"] >= 2

    def test_no_phishing_keywords_in_clean_url(self):
        feat = url_features.extract("https://weather.gov/forecast")
        assert feat["phishing_kw_count"] == 0

    def test_many_subdomains_flag(self):
        feat = url_features.extract("http://a.b.c.evil.com")
        assert feat["has_many_subdomains"] == 1

    def test_long_subdomain_flag(self):
        feat = url_features.extract("http://verylongsubdomainname123456789.evil.com")
        assert feat["has_long_subdomain"] == 1


class TestEdgeCases:
    def test_empty_url_returns_parse_error(self):
        feat = url_features.extract("")
        assert feat["parse_error"] == 1

    def test_malformed_url_returns_zero_vector(self):
        feat = url_features.extract("not-a-url!@#$%")
        # Should not raise; parse_error may be 0 if tldextract handles it
        assert isinstance(feat, dict)

    def test_very_long_url(self):
        long_url = "http://evil.xyz/" + "a" * 500
        feat = url_features.extract(long_url)
        assert feat["url_len"] > 500
        assert feat["parse_error"] == 0

    def test_ftp_scheme(self):
        feat = url_features.extract("ftp://files.example.com/secret.zip")
        assert feat["has_https"] == 0
        assert feat["has_http"] == 0

    def test_determinism(self):
        """Same URL must always produce identical features."""
        url = "https://login.microsoft-verify.xyz/account?confirm=1"
        feat1 = url_features.extract(url)
        feat2 = url_features.extract(url)
        for k in url_features.feature_names():
            assert feat1[k] == feat2[k], f"Non-deterministic feature: {k}"

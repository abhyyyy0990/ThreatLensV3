# ThreatLens Roadmap

## Phase 0 --- Clean foundation

-   [ ] Create new repository
-   [ ] Create package structure
-   [ ] Pin dependencies
-   [ ] Create `.env.example`
-   [ ] Configure Git ignore
-   [ ] Add logging/config modules
-   [ ] Add baseline tests

## Phase 1 --- Data pipeline

-   [ ] Gather approved datasets
-   [ ] Normalize
-   [ ] Deduplicate
-   [ ] Detect leakage
-   [ ] Create hard negatives
-   [ ] Create reproducible splits
-   [ ] Generate dataset report

## Phase 2 --- ML

-   [ ] Build baseline model
-   [ ] Train multiple candidates
-   [ ] Compare metrics
-   [ ] Tune hyperparameters
-   [ ] Tune thresholds
-   [ ] Calibrate probabilities
-   [ ] Lock test set
-   [ ] Register model
-   [ ] Generate model card

## Phase 3 --- Intelligence

-   [ ] Google Safe Browsing adapter
-   [ ] PhishTank adapter
-   [ ] Normalize provider results
-   [ ] Add caching
-   [ ] Add timeout/retry behavior
-   [ ] Add provider health status

## Phase 4 --- Decision engine

-   [ ] Rules engine
-   [ ] ML inference
-   [ ] Intelligence fusion
-   [ ] Confidence bands
-   [ ] Explainable evidence
-   [ ] Recommendations
-   [ ] Unified ThreatResult

## Phase 5 --- Scanners

-   [ ] URL
-   [ ] Email
-   [ ] QR
-   [ ] Screenshot/OCR
-   [ ] Batch CSV
-   [ ] History

## Phase 6 --- UI

-   [ ] Dashboard
-   [ ] Scanner navigation
-   [ ] Results view
-   [ ] Evidence view
-   [ ] History
-   [ ] Export
-   [ ] Responsive design

## Phase 7 --- Hardening

-   [ ] Security tests
-   [ ] Regression suite
-   [ ] Secret scan
-   [ ] Dependency review
-   [ ] Production build
-   [ ] Deployment configuration

## Phase 8 --- Monitoring and improvement

-   [ ] Model drift tracking
-   [ ] Hard-negative collection
-   [ ] Feedback loop
-   [ ] Scheduled evaluation
-   [ ] Controlled retraining

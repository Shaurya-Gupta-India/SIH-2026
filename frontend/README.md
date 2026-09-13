# MAGANAI — MOIL Mining Intelligence Website

This is the final frontend build for the MOIL mining-intelligence workflow.

## Run locally

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`.

## Frontend scope

- 10 MOIL mine/lease locations: Chikla, Dongri Buzurg, Beldongri, Kandri, Munsar, Gumgaon, Balaghat, Ukwa, Tirodi, Sitapatore.
- Light corporate visual system with high-contrast earth and signal colours.
- India / central-India geospatial context with Maharashtra and Madhya Pradesh MOIL-region overlays.
- Interactive prospectivity heatmap and mine markers.
- Network-level annual production view when no mine is selected.
- Mine-level grade, depth, annual-production share and prospectivity context after a mine is selected.
- Production, shortfall, equipment, decision, Copilot, history and model-evidence screens.

## Backend integration points

The current UI has a clean data boundary so FastAPI can replace the seeded view-model values without redesigning the interface. Intended endpoints include `/prospectivity/predict`, `/production/predict`, `/equipment/predict`, `/corrective-action`, and `/ai/explain`.

The UI uses modelled prospectivity terminology and does not present satellite imagery as proof of an underground reserve.

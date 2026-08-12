# Dashboard 2.0 visual smoke test

- Local preview ran with `VITE_USE_MOCK_DATA=true` supplied at process start; no repository environment files were changed.
- Login succeeded with the documented executive mock account and `/dashboard` rendered successfully.
- Header renders as a dark enterprise command-centre banner with reporting period, last-updated timestamp, primary Year/Month/LGA filters, More Filters, and Clear controls.
- More Filters expands State, Facility type, Ownership, and Sector controls without obscuring the main dashboard.
- Executive KPI row renders Provider, Active Provider, Total Enrollee, Formal, Informal, Expenditure, and PEPM metrics. Tablet-width preview showed seven cards too compressed before the responsive class was adjusted from `xl:grid-cols-7` to `2xl:grid-cols-7`.
- Network Coverage renders Provider by LGA, Facility Type, Ownership, and Active vs not active distribution.
- Population Intelligence renders formal/informal, principal/dependant, sector distribution, monthly trend, top LGAs, and top facilities. The UI explicitly preserves source CATEGORY authority.
- Financial Intelligence summary renders Claims/Capitation/FFS mix, expenditure trend, PEPM trend, top cost LGAs/providers, and PEPM by sector/LGA/provider.
- Management Attention is populated from rule-based high-PEPM, large-change, unmatched-provider, and import-warning signals. Recent Activity and Quick Actions are present below the fold.
- Console showed only existing React Router future-flag warnings; no runtime error was observed after mock mode was enabled.

The lower-page audit confirms the PEPM breakdown is visually readable and the Management Attention cards provide direct investigation links. The page remains dense but structured into clear command-centre sections; no blank panels or runtime errors appeared in the rendered mock data view.

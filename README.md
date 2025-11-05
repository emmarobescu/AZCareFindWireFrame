# AZCareFindWireFrame
AZ Care Finder is a web-based platform that helps families locate licensed assisted-living homes across Arizona with clarity and speed. The application aggregates all state-licensed homes and presents them through an interactive map and structured facility details so users can compare options quickly. The site is deployed on Vercel and maintained as a public repository on GitHub.

Overview

AZ Care Finder allows users to discover facilities through two primary paths. First, users can apply filters—city, ZIP code, search radius, level of care (supervisory, personal, or directed), and facility type (residential home or large facility)—to narrow results before exploring an interactive map. Second, users can take a short placement assessment that determines an appropriate level of care and then routes them to matching facilities on the map. Selecting any facility marker opens a concise profile that includes the facility’s name, address, phone number, capacity, type of home, level of care provided, and an estimated price range.

Features

The filter-driven search is designed to minimize guesswork and surfacing delays by letting users specify geography and care requirements up front. The assessment offers a guided alternative for users who are uncertain about terminology or care levels, translating plain-language responses into a recommended level of care. Facility detail views emphasize scannability and consistency so that families can evaluate multiple options efficiently. A “List Your Business” page enables providers to request inclusion or updates; at present, updates are processed manually, and a provider sign-in flow is under development to support self-service profiles and timely availability posts.

Algorithms

The application includes two core pieces of logic. The placement assessment processes answers to ten short questions and assigns one of three care levels—supervisory, personal, or directed—based on weighted criteria tied to daily living needs, cognitive support, and supervision requirements. The price-estimate function produces a conservative monthly estimate for each facility by combining level-of-care multipliers with facility-type factors. It is intentionally simple and explainable today; it does not currently vary estimates by region.

Technology Stack

The front end is implemented with HTML, CSS, and JavaScript, using Sketch and Adobe Illustrator for high-fidelity design assets and iconography. The site is hosted on Vercel for fast, reliable deployment with automatic builds from GitHub. Data is sourced from the Arizona Department of Health Services licensing information and normalized for consistent display and search.

Design and Implementation

High-fidelity wireframes were translated into semantic HTML and modular CSS, with particular attention to spacing, alignment, and responsive behavior so screens render cleanly across common laptop and tablet sizes. Interactive elements are kept minimal and purposeful to preserve clarity. The assessment flow prioritizes plain-language prompts and immediate feedback, routing users directly back to the map with applied filters that reflect the recommended care level.

Roadmap

Near-term priorities include improving assessment accuracy with expanded test cases, adding confidence ranges and inline assumptions to the price-estimate display, enabling authenticated provider profiles with timestamps for updates, and offering saved searches and quick sorting by distance or estimated cost. Accessibility and performance remain ongoing goals; future iterations will target WCAG 2.2 AA alignment and incremental front-end optimizations.

Deployment and Development

The site is deployed via Vercel. For local development, clone the repository, open the project directory, and launch index.html in a modern browser. Changes pushed to the main branch trigger Vercel builds automatically. Environment-specific configuration is minimized to keep the project easy to run without special setup.

Contact

Created and maintained by Emma Robescu. For questions, updates, or provider requests, please use the site’s request form or contact the maintainer via the email listed in the repository profile.

License

This project is licensed under the MIT License. See the LICENSE file for details.

# DECRED.SUPPLY — Network Dashboard

> **"No VCs. No pre-mine. Just code."**

A live, cinematic dashboard for the Decred network, focusing on strictly enforced protocol constraints:
*   **Network Health**: Real-time ticker and network stats (Stake participation, Treasury runway, Ticket pool metrics)
*   **Protocol-Enforced Lockup**: Visualizes the total minted supply versus strictly locked DCR (PoS tickets + Treasury)
*   **Cross-Chain Comparisons**: Displays how Decred's fair distribution compares to VC-heavy or pure PoW networks.

## Live Preview
Explore the live dashboard at [decred.supply](https://decred.supply/).

## Getting Started Locally

### Runtime Requirements
*   Node.js `20.19+` or `22.12+` (tested with `22.22.0`)
*   npm `10+`

### Installation & Development
Clone the repository and install the dependencies:
```bash
# We recommend using NVM to quickly select Node 22
nvm use 22

npm install
npm run dev
```

### Building for Production
To build a static, optimized version of the dashboard:
```bash
npm run build
```

## Deployment (GitHub Pages)

This project is configured right now to easily deploy its static frontend to GitHub Pages using the `gh-pages` npm package.

1.  Make sure your changes are fully committed and pushed to your `main` branch.
2.  Run the deployment script:
    ```bash
    npm run deploy
    ```
3.  Ensure your repository's **Settings > Pages** is configured to build from the **`gh-pages` branch**.

## Data Sources
- Live network metrics are fetched from `dcrdata.decred.org/api`
- Real-time pricing & volume data is fetched via the CoinGecko API.

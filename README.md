# VowSwap - Wedding Marketplace

VowSwap is a modern e-commerce platform for pre-loved wedding items, built with Next.js 13+ and Tailwind CSS. This project represents Phase 1 of rebuilding a complex app into something simpler and more maintainable, focusing on core e-commerce functionality.

## Features

- **Modern Tech Stack**: Next.js 13+ with App Router, TypeScript, and Tailwind CSS
- **Responsive Design**: Mobile-first approach with clean, minimal UI
- **Product Management**: Browse, filter, and view detailed product information
- **Category Navigation**: Shop by categories (dresses, accessories, decorations)
- **Optimized for Vercel**: Ready for deployment with proper configuration

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm 9.x or later

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/vowswap.git
   cd vowswap
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
vowswapping/
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── products/         # Product pages
│   │   ├── globals.css       # Global styles
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Home page
│   ├── components/           # React components
│   │   ├── layout/           # Layout components
│   │   ├── product/          # Product components
│   │   └── ui/               # UI components
│   ├── lib/                  # Utility functions
│   └── types/                # TypeScript types
├── public/                   # Static assets
├── next.config.js            # Next.js configuration
├── tailwind.config.js        # Tailwind CSS configuration
├── tsconfig.json             # TypeScript configuration
└── vercel.json               # Vercel deployment configuration
```

## Deployment

This project is configured for deployment on Vercel. Simply push to your GitHub repository and connect it to Vercel for automatic deployments.

```bash
npm run build
```

## Future Enhancements (Phase 2+)

- User authentication and profiles
- Shopping cart and checkout functionality
- Payment processing integration
- Order management
- Seller dashboard
- Reviews and ratings
- Wishlist functionality

## License

This project is licensed under the MIT License - see the LICENSE file for details.

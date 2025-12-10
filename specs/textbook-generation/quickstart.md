# Quickstart: AI-Native Textbook Generation

## Prerequisites

- Node.js v18+ installed
- npm or yarn package manager
- Git for version control
- GitHub account for deployment

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd <repository-name>
```

### 2. Install Dependencies

```bash
# Navigate to the website directory
cd website

# Install Docusaurus dependencies
npm install
# or
yarn install
```

### 3. Environment Configuration

Create a `.env` file in the `website` directory with the following variables:

```env
# API endpoint for user data and progress tracking
REACT_APP_API_BASE_URL=http://localhost:3001/api

# Authentication settings (if using OAuth)
REACT_APP_AUTH_CLIENT_ID=your_client_id
REACT_APP_AUTH_PROVIDER=google  # or github

# Analytics (optional)
GATSBY_GOOGLE_ANALYTICS_ID=your_tracking_id
```

### 4. Local Development

```bash
# Start the development server
npm run dev
# or
yarn start

# The site will be available at http://localhost:3000
```

### 5. Adding New Content

#### Creating a New Chapter

1. Create a new directory in `website/docs/`:
   ```bash
   mkdir website/docs/chapter-7
   ```

2. Add a README.md file in the new directory:
   ```markdown
   ---
   id: index
   title: Chapter 7 Title
   sidebar_position: 7
   ---

   # Chapter 7: Title

   Chapter overview content here...
   ```

3. Add the chapter to `website/sidebars.js`:
   ```javascript
   module.exports = {
     textbook: [
       // ... existing chapters
       {
         type: 'category',
         label: 'Chapter 7: Title',
         items: ['chapter-7/index'],
       },
     ],
   };
   ```

#### Adding Sections to a Chapter

1. Create a new markdown file in the chapter directory:
   ```bash
   touch website/docs/chapter-7/key-concepts.md
   ```

2. Add frontmatter and content:
   ```markdown
   ---
   id: key-concepts
   title: Key Concepts
   sidebar_position: 1
   ---

   # Key Concepts

   Content for the section...
   ```

### 6. Adding Interactive Elements

#### Code Blocks with Execution

Use the special code block syntax for executable examples:

````
```jsx live
function Counter() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}
```
````

#### Exercise Components

Create interactive exercises using the custom components:

```markdown
import Exercise from '@site/src/components/Exercise';

<Exercise
  type="multiple-choice"
  question="What is the primary advantage of Docusaurus?"
  options={["Easy documentation", "Fast performance", "Both A and B", "None"]}
  answer={2}
/>
```

### 7. Building for Production

```bash
# Build the static site
npm run build
# or
yarn build

# The built site will be in the `build` directory
```

### 8. Local Testing of Production Build

```bash
# Serve the production build locally
npm run serve
# or
yarn serve

# The site will be available at http://localhost:3000
```

## API Service Setup (Optional)

If you need user authentication and progress tracking:

### 1. Navigate to API directory

```bash
cd api
npm install
```

### 2. Set up environment variables

Create `.env` in the `api` directory:

```env
PORT=3001
DATABASE_URL=postgresql://user:password@localhost/textbook
JWT_SECRET=your_jwt_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

### 3. Run the API server

```bash
npm run dev
# Server will run on http://localhost:3001
```

## Deployment to GitHub Pages

### 1. Configure GitHub Actions

Ensure the `.github/workflows/deploy.yml` file exists with proper configuration:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: Install dependencies
        run: cd website && npm ci
      - name: Build website
        run: cd website && npm run build
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./website/build
```

### 2. Enable GitHub Pages

1. Go to your repository settings
2. Navigate to "Pages" section
3. Select "GitHub Actions" as the source
4. Save the settings

## Common Commands

```bash
# Check for broken links
npm run build
npx linkinator build --recurse

# Format code
npm run format

# Run tests
npm run test

# Update dependencies
npm update
```

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Change port in package.json or use:
   npm start -- --port 3001
   ```

2. **Build fails with memory issues**
   ```bash
   # Increase Node.js memory limit
   export NODE_OPTIONS="--max_old_space_size=4096"
   npm run build
   ```

3. **Images not loading**
   - Place images in `website/static/img/`
   - Reference as `![alt text](/img/filename.jpg)`

### Getting Help

- Check the [Docusaurus documentation](https://docusaurus.io/docs)
- Review the [feature specification](specs/textbook-generation/spec.md)
- Look at existing examples in the `website/docs/` directory
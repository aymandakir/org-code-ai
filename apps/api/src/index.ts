import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/orgs/:orgLogin/repos', async (req, res) => {
  try {
    const { orgLogin } = req.params;
    // TODO: Implement GitHub GraphQL client integration
    res.json({ message: 'Fetch org repos endpoint', orgLogin });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

app.post('/api/repos/:repoId/scan', async (req, res) => {
  try {
    const { repoId } = req.params;
    // TODO: Implement code scanning with AI agents
    res.json({ message: 'Scan repo endpoint', repoId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to scan repository' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
});


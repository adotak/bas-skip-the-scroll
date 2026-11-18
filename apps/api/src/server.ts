import { app } from './app';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`[Skip the Scroll API] Server listening on http://localhost:${PORT}`);
});

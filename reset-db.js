// Resets notebook.db to three sample notes.
// Run with:  npm run reset-db
// Warning: this removes every note currently in the database.

const db = require('./database');

const samples = [
  {
    artworkId: 16568,
    title: 'Water Lilies',
    artist: 'Claude Monet',
    imageId: '3c27b499-af56-f0d5-93b5-a7f2f1ad5813',
    note: 'No horizon at all, only water. Step back to see the shadow across the top third.',
    rating: 5
  },
  {
    artworkId: 16571,
    title: 'Arrival of the Normandy Train, Gare Saint-Lazare',
    artist: 'Claude Monet',
    imageId: '0f1cc0e0-e42e-be16-3f71-2022da38cb93',
    note: 'The steam does most of the work. The people on the platform are barely sketched in.',
    rating: 4
  },
  {
    artworkId: 111628,
    title: 'Nighthawks',
    artist: 'Edward Hopper',
    imageId: '831a05de-d3f6-f4fa-a460-23008dd58dda',
    note: 'Come back to this one. Look for the door into the diner; there is none.',
    rating: null
  }
];

async function reset() {
  await db.deleteAllNotes();

  for (const sample of samples) {
    await db.createNote(sample);
  }

  const notes = await db.getAllNotes();
  console.log(`notebook.db now holds ${notes.length} sample notes.`);
  await db.close();
}

reset().catch((err) => {
  console.error('Reset failed:', err.message);
  process.exit(1);
});

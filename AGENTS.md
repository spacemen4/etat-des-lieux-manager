# Supabase Photo Uploads

When uploading photos to Supabase, ensure that the `photos` array is not double-JSON-stringified. The Supabase client library handles the serialization of the array to JSONB correctly, so you should pass the array directly to the `update` or `insert` function.

For example, in `ReleveCompteursStep.tsx`, the `handleSave` function was changed from this:

```javascript
const dataToSave = {
  // ...
  photos: JSON.stringify(allPhotos),
};
```

to this:

```javascript
const dataToSave = {
  // ...
  photos: allPhotos,
};
```

This ensures that the data is sent to Supabase in the correct format.

const formData = new FormData();

formData.append('name', 'The Pragmatic Programmer');
formData.append('description', 'A classic book for software engineers.');
formData.append('qty', '10');
formData.append('normalPrice', '25000');
formData.append('sellingPrice', '20000');

// Add categoryIds (as multiple fields)
formData.append('categoryIds[]', 'catid123');
formData.append('categoryIds[]', 'catid456');

// Add categories (as JSON string, or as multiple fields if backend supports it)
formData.append('categories', JSON.stringify([
  { id: 'catid123', name: 'Technology' },
  { id: 'catid456', name: 'Education' }
]));

// Other fields
formData.append('language', 'english');
formData.append('format', 'hardcover');
formData.append('genre', 'non_fiction');
formData.append('rated', 'PG');
formData.append('coverImage', 'https://example.com/cover.jpg');
formData.append('isbn', '9780135957059');
formData.append('publisher', 'Addison-Wesley');
formData.append('commission', '5');

// If uploading a file (e.g., cover image)
// formData.append('coverImageFile', fileInput.files[0]);

// Send with fetch or axios
fetch('/api/books', {
  method: 'POST',
  body: formData,
  // Do NOT set Content-Type header; browser will set it automatically for FormData
});


Key Points:
categoryIds[]: Use the [] notation to send multiple values for the same key. The backend will receive this as an array.
categories: Send as a JSON string (the backend can parse it if needed).
All other fields: Send as simple key-value pairs.
Files: Attach as needed (e.g., coverImageFile).


Directive for Cursor AI or Devs:
> When sending a book creation request as FormData:
> - Use categoryIds[] for each category ID (e.g., categoryIds[]=catid123, categoryIds[]=catid456).
> - Optionally, include a categories field as a JSON stringified array of objects with id and name.
> - Include all other book fields as individual FormData entries.
> - Attach files as needed.
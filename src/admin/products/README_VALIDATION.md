# Product Validation Rules and Limits

This document outlines all validation rules and limits for adding products (books) to the system.

## API Endpoints

### Get Validation Information
```
GET /admin/products/validation-info
```
Returns all validation limits and rules that the frontend should enforce.

### Add New Books
```
POST /admin/products/add-new
```
Adds multiple books with images. Supports both indexed and array formats.

## Validation Limits

### Book Limits
- **Maximum books per request**: 10 books
- **Maximum images per book**: 5 images
- **Maximum file size per image**: 5MB
- **Maximum total file size**: 50MB
- **Allowed image types**: JPEG, JPG, PNG, WebP, GIF

### Text Field Limits
- **Book name**: 200 characters max
- **Description**: 2000 characters max
- **Publisher**: 100 characters max
- **ISBN**: 20 characters max
- **Rated**: 10 characters max

### Numeric Limits
- **Price range**: $0 - $10,000
- **Stock range**: 0 - 10,000
- **Selling price**: Cannot be higher than normal price

## Frontend Implementation Guidelines

### 1. Pre-validation
Before sending data to the backend, validate:
- Number of books ≤ 10
- Number of images per book ≤ 5
- File sizes ≤ 5MB each
- Total file size ≤ 50MB
- Text field lengths within limits
- Price and stock within ranges

### 2. File Upload Structure
Use indexed format for file uploads:
```
display_images[0] = file1.jpg  // Book 0, Image 0
display_images[1] = file2.jpg  // Book 0, Image 1
display_images[2] = file3.jpg  // Book 0, Image 2
display_images[3] = file4.jpg  // Book 0, Image 3
display_images[4] = file5.jpg  // Book 0, Image 4
display_images[5] = file6.jpg  // Book 1, Image 0
display_images[6] = file7.jpg  // Book 1, Image 1
...
```

### 3. Book Data Structure
Use indexed format for book data:
```
name[0] = "Book 1 Name"
description[0] = "Book 1 Description"
qty[0] = 10
sellingPrice[0] = 25.99
normalPrice[0] = 29.99
category[0] = "fiction"
genre[0] = "mystery"
format[0] = "paperback"
language[0] = "english"
rated[0] = "PG-13"
isbn[0] = "1234567890123"
publisher[0] = "Publisher Name"
commission[0] = "10"

name[1] = "Book 2 Name"
description[1] = "Book 2 Description"
...
```

## Error Handling

### Common Validation Errors
- `Cannot add more than 10 books at once`
- `Cannot upload more than 5 images per book`
- `File size must be less than 5MB`
- `Only image/jpeg, image/jpg, image/png, image/webp, image/gif files are allowed`
- `Total file size must be less than 50MB`
- `Book name must be less than 200 characters`
- `Price must be between $0 and $10000`
- `Stock must be between 0 and 10000`
- `Selling price cannot be higher than normal price`

### Frontend Error Prevention
1. **File Upload Limits**:
   - Show file size before upload
   - Disable upload button if limits exceeded
   - Show progress bar for large uploads

2. **Form Validation**:
   - Real-time character count for text fields
   - Price range validation
   - Stock number validation
   - ISBN format validation

3. **User Feedback**:
   - Clear error messages
   - Visual indicators for validation status
   - Confirmation dialogs for large uploads

## Example Implementation

### React/JavaScript Example
```javascript
// Get validation limits
const validationInfo = await fetch('/admin/products/validation-info').then(r => r.json());

// Validate before upload
function validateUpload(books, files) {
    if (books.length > validationInfo.maxBooksPerRequest) {
        throw new Error(`Cannot add more than ${validationInfo.maxBooksPerRequest} books`);
    }
    
    // Validate each book
    books.forEach((book, index) => {
        if (book.name.length > validationInfo.maxNameLength) {
            throw new Error(`Book ${index}: Name too long`);
        }
        // ... other validations
    });
    
    // Validate files
    let totalSize = 0;
    files.forEach(file => {
        if (file.size > validationInfo.maxFileSizeMB * 1024 * 1024) {
            throw new Error(`File ${file.name} too large`);
        }
        totalSize += file.size;
    });
    
    if (totalSize > validationInfo.maxTotalFileSizeMB * 1024 * 1024) {
        throw new Error('Total file size too large');
    }
}

// Prepare form data
function prepareFormData(books, files) {
    const formData = new FormData();
    
    // Add book data
    books.forEach((book, index) => {
        Object.keys(book).forEach(key => {
            formData.append(`${key}[${index}]`, book[key]);
        });
    });
    
    // Add files
    files.forEach((file, index) => {
        formData.append(`display_images[${index}]`, file);
    });
    
    return formData;
}
```

## Best Practices

1. **Always validate on frontend first** - Don't rely only on backend validation
2. **Show clear progress** - For large uploads, show progress indicators
3. **Handle errors gracefully** - Provide clear, actionable error messages
4. **Test edge cases** - Test with maximum limits and boundary values
5. **Cache validation info** - Store validation limits locally to avoid repeated API calls
6. **Provide fallbacks** - If validation info can't be loaded, use conservative defaults

## Testing

Test the following scenarios:
- Adding exactly 10 books (maximum)
- Adding 5 images per book (maximum)
- Uploading files at exactly 5MB each
- Total file size at exactly 50MB
- Text fields at maximum lengths
- Prices at minimum and maximum values
- Invalid file types
- Missing required fields
- Duplicate ISBNs 
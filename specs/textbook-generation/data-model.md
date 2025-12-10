# Data Model: AI-Native Textbook Generation

## Entity Relationships

### Content Entities

#### Chapter
- **ID**: UUID (Primary Key)
- **title**: String (required)
- **slug**: String (required, unique, URL-friendly)
- **content**: String (Markdown format)
- **learning_objectives**: Array<String> (required)
- **prerequisites**: Array<String> (optional)
- **estimated_time_minutes**: Integer (required)
- **order_index**: Integer (required, for sequencing)
- **status**: Enum ('draft', 'review', 'published') (default: 'draft')
- **created_at**: DateTime (required)
- **updated_at**: DateTime (required)
- **version**: Integer (required, for tracking changes)

#### Section
- **ID**: UUID (Primary Key)
- **chapter_id**: UUID (Foreign Key → Chapter)
- **title**: String (required)
- **slug**: String (required, unique within chapter)
- **content_type**: Enum ('overview', 'concepts', 'examples', 'exercises', 'references') (required)
- **content**: String (Markdown format)
- **order_index**: Integer (required, for sequencing within chapter)
- **created_at**: DateTime (required)
- **updated_at**: DateTime (required)

#### Media
- **ID**: UUID (Primary Key)
- **section_id**: UUID (Foreign Key → Section, nullable for chapter-level media)
- **type**: Enum ('image', 'video', 'diagram', 'audio') (required)
- **title**: String (required)
- **path**: String (required, relative path from static directory)
- **alt_text**: String (optional)
- **license**: String (optional, e.g., 'CC BY', 'proprietary')
- **file_size_kb**: Integer (optional)
- **dimensions**: String (optional, e.g., '1920x1080' for images)
- **created_at**: DateTime (required)

#### Exercise
- **ID**: UUID (Primary Key)
- **section_id**: UUID (Foreign Key → Section)
- **type**: Enum ('multiple_choice', 'short_answer', 'coding', 'essay') (required)
- **question**: String (required, Markdown format)
- **options**: Array<String> (for multiple choice, optional)
- **answer**: String (required, Markdown format)
- **explanation**: String (optional, Markdown format)
- **difficulty**: Enum ('beginner', 'intermediate', 'advanced') (default: 'intermediate')
- **order_index**: Integer (required, for sequencing within section)
- **created_at**: DateTime (required)
- **updated_at**: DateTime (required)

#### Reference
- **ID**: UUID (Primary Key)
- **section_id**: UUID (Foreign Key → Section)
- **type**: Enum ('academic', 'documentation', 'external', 'internal') (required)
- **citation**: String (required, properly formatted)
- **url**: String (optional)
- **description**: String (optional)
- **order_index**: Integer (required, for sequencing within section)
- **created_at**: DateTime (required)

### User Entities

#### User
- **ID**: UUID (Primary Key)
- **email**: String (required, unique)
- **username**: String (optional, unique)
- **auth_provider**: Enum ('google', 'github', 'email') (required)
- **auth_provider_id**: String (required, for OAuth linking)
- **preferences**: JSON (optional, user preferences)
- **language**: String (default: 'en')
- **timezone**: String (optional)
- **created_at**: DateTime (required)
- **updated_at**: DateTime (required)

#### UserProgress
- **ID**: UUID (Primary Key)
- **user_id**: UUID (Foreign Key → User)
- **chapter_id**: UUID (Foreign Key → Chapter)
- **section_id**: UUID (Foreign Key → Section, nullable for chapter-level progress)
- **completion_status**: Enum ('not_started', 'in_progress', 'completed') (default: 'not_started')
- **completion_percentage**: Integer (0-100, default: 0)
- **last_accessed_at**: DateTime (required)
- **completed_at**: DateTime (optional)
- **created_at**: DateTime (required)
- **updated_at**: DateTime (required)

#### Bookmark
- **ID**: UUID (Primary Key)
- **user_id**: UUID (Foreign Key → User)
- **section_id**: UUID (Foreign Key → Section)
- **custom_notes**: String (optional, Markdown format)
- **created_at**: DateTime (required)
- **updated_at**: DateTime (required)

#### AssessmentResponse
- **ID**: UUID (Primary Key)
- **user_id**: UUID (Foreign Key → User)
- **exercise_id**: UUID (Foreign Key → Exercise)
- **response**: String (required, user's answer)
- **score**: Integer (0-100, calculated)
- **is_correct**: Boolean (calculated)
- **submitted_at**: DateTime (required)

### Localization Entities

#### Translation
- **ID**: UUID (Primary Key)
- **content_id**: UUID (ID of the content being translated)
- **content_type**: Enum ('chapter', 'section', 'exercise', 'reference') (required)
- **language_code**: String (required, e.g., 'ur', 'en', 'es')
- **translated_content**: String (required, translated text)
- **review_status**: Enum ('pending', 'reviewed', 'approved') (default: 'pending')
- **reviewed_by**: UUID (Foreign Key → User, optional)
- **created_at**: DateTime (required)
- **updated_at**: DateTime (required)

#### Locale
- **ID**: UUID (Primary Key)
- **language_code**: String (required, unique, e.g., 'ur', 'en')
- **name**: String (required, e.g., 'Urdu', 'English')
- **direction**: Enum ('ltr', 'rtl') (default: 'ltr')
- **is_active**: Boolean (default: true)
- **created_at**: DateTime (required)

## Validation Rules

### Chapter
- Title must be 1-200 characters
- Slug must follow URL-friendly format (alphanumeric, hyphens, lowercase)
- Estimated time must be 1-999 minutes
- Order index must be unique within the textbook

### Section
- Title must be 1-200 characters
- Slug must be unique within the parent chapter
- Order index must be unique within the parent chapter

### Media
- Path must exist in static directory
- File size should be optimized (under 5MB for images)

### Exercise
- Question must not be empty
- For multiple choice, must have 2-6 options
- Score must be 0-100

### User
- Email must be valid format
- Email must be unique
- Username, if provided, must be 3-30 characters

### UserProgress
- Completion percentage must be 0-100
- User can only have one progress record per section/chapter

## State Transitions

### Chapter Status
- draft → review: When content is ready for review
- review → published: When content passes review
- published → review: When content needs updates

### Translation Review Status
- pending → reviewed: When reviewed by native speaker
- reviewed → approved: When approved for publication
- approved → reviewed: When changes are requested

## Indexes

### Performance Indexes
- UserProgress: (user_id, chapter_id) for progress lookup
- UserProgress: (user_id, section_id) for section progress
- Chapter: (order_index) for sequencing
- Section: (chapter_id, order_index) for section sequencing
- Bookmark: (user_id, section_id) for quick lookup
- AssessmentResponse: (user_id, exercise_id) for scoring
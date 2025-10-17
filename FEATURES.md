# LearnHub - Learning Management System
## Complete Feature Documentation

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Core Features](#core-features)
3. [User Roles](#user-roles)
4. [Database Architecture](#database-architecture)
5. [Feature Implementation Details](#feature-implementation-details)
6. [UI/UX Design](#uiux-design)
7. [Security Features](#security-features)
8. [Technical Stack](#technical-stack)

---

## System Overview

LearnHub is a comprehensive Learning Management System designed for modern education. It provides teachers and students with powerful tools for course management, assignment tracking, real-time collaboration, and performance analytics.

### Key Highlights
- **Real-time collaboration** with live chat and messaging
- **Automated grading system** with intelligent rank allocation
- **Gamified leaderboards** to encourage healthy competition
- **Profile customization** with social media integration
- **Beautiful, responsive UI** with dark/light theme support

---

## Core Features

### 1. Landing Page & Authentication

#### Landing Page
**File:** `src/pages/LandingPage.tsx`

**Features:**
- Animated welcome screen with smooth entrance effects
- Feature showcase cards (4 main features highlighted)
- About section with platform statistics
- Responsive design with gradient backgrounds
- Call-to-action buttons to get started

**Animations:**
- Fade-in effects for main content
- Slide-up animations for headings
- Staggered entrance for feature cards
- Bounce effect for logo icon

**Implementation:**
```typescript
// Key animations defined with CSS keyframes
@keyframes fadeIn { /* opacity transition */ }
@keyframes slideUp { /* vertical slide with opacity */ }
@keyframes fadeInUp { /* combined fade and slide */ }
@keyframes bounceSlow { /* gentle bounce effect */ }
```

#### Authentication System
**File:** `src/components/AuthForm.tsx`

**Features:**
- Email/password authentication using Supabase Auth
- Role selection (Student/Teacher)
- Sign up and sign in toggle
- Automatic profile creation on registration
- Session management with JWT tokens

**Security:**
- Passwords hashed by Supabase Auth
- Protected routes for authenticated users only
- Session persistence with secure cookies

---

### 2. User Profiles & Management

#### Profile Editing
**File:** `src/components/ProfileModal.tsx`

**Features:**
- **Personal Information:**
  - Full name editing
  - Bio/description field
  - Profile photo upload (max 10MB)

- **Social Media Integration:**
  - LinkedIn profile URL
  - GitHub profile URL
  - Twitter/X handle
  - Instagram profile
  - Personal website link

**Database Schema:**
```sql
profiles table:
  - id (uuid, primary key)
  - name (text)
  - role (enum: 'teacher' | 'student')
  - bio (text)
  - profile_photo_url (text)
  - social_links (jsonb)
  - avatar_url (text, nullable)
  - created_at (timestamp)
```

**Implementation Details:**
- Photo preview before upload
- Base64 encoding for image storage
- JSON field for flexible social links
- Real-time profile updates
- Accessible from header profile icon

---

### 3. Course Management

#### Course Creation (Teachers)
**File:** `src/pages/TeacherDashboard.tsx`

**Features:**
- Create new courses with:
  - Course title
  - Detailed description
  - Duration (text field for flexibility)
  - Video URL (YouTube/Vimeo support)
  - Thumbnail image (optional)

**Database Schema:**
```sql
courses table:
  - id (uuid, primary key)
  - title (text)
  - description (text)
  - teacher_id (uuid, foreign key)
  - thumbnail_url (text, nullable)
  - duration (text, nullable)
  - video_url (text, nullable)
  - created_at (timestamp)
  - updated_at (timestamp)
```

#### Course Enrollment (Students)
**File:** `src/pages/StudentDashboard.tsx`

**Features:**
- Browse all available courses
- View course details (teacher, description, enrollment count)
- One-click enrollment
- View enrolled courses separately
- Track course progress

**Database Schema:**
```sql
enrollments table:
  - id (uuid, primary key)
  - course_id (uuid, foreign key)
  - student_id (uuid, foreign key)
  - enrolled_at (timestamp)
```

---

### 4. Assignment System

#### Assignment Creation (Teachers)
**File:** `src/components/AssignmentModal.tsx`

**Features:**
- Create assignments with:
  - Title and description
  - Due date with date-time picker
  - Maximum marks (default: 100)
  - Automatic timestamp tracking

**Database Schema:**
```sql
assignments table:
  - id (uuid, primary key)
  - course_id (uuid, foreign key)
  - title (text)
  - description (text)
  - due_date (timestamp)
  - max_marks (integer, default: 100)
  - created_at (timestamp)
```

#### Assignment Submission (Students)
**File:** `src/components/SubmissionModal.tsx`

**Features:**
- Submit assignments with:
  - Written content/description
  - Optional file URL (GitHub repo, Google Drive, etc.)
  - Automatic submission timestamp
  - Status tracking (Pending/Submitted/Graded)

**Status Indicators:**
- ⏳ **Pending** - Not yet submitted
- 🔵 **Submitted** - Waiting for grading
- ✅ **Graded** - Teacher has evaluated
- 🔴 **Overdue** - Past due date without submission

**Database Schema:**
```sql
submissions table:
  - id (uuid, primary key)
  - assignment_id (uuid, foreign key)
  - student_id (uuid, foreign key)
  - content (text)
  - file_url (text, nullable)
  - submitted_at (timestamp)
```

#### Grading System
**File:** `src/components/GradingModal.tsx`

**Features:**
- Teacher evaluation with:
  - Marks slider (0 to max_marks)
  - Written feedback
  - Automatic rank calculation
  - Grade history and updates

**Rank Allocation Logic:**
```javascript
Percentage Range → Grade → Rank Badge
90-100%         → A+    → Platinum (Purple/Pink)
75-89%          → A     → Gold (Yellow/Orange)
50-74%          → B     → Silver (Gray)
Below 50%       → C     → Bronze (Brown/Red)
```

**Database Schema:**
```sql
grades table:
  - id (uuid, primary key)
  - submission_id (uuid, foreign key, unique)
  - marks (integer)
  - feedback (text, nullable)
  - graded_at (timestamp)
```

**Upsert Logic:**
- Teachers can update grades
- One grade per submission (enforced by unique constraint)
- Automatic timestamp on grading/update

---

### 5. Leaderboard System

**File:** `src/components/Leaderboard.tsx`

**Features:**
- **Dynamic Rankings:**
  - Top 10 students per course
  - Average percentage calculation
  - Total marks aggregation
  - Submission count tracking

- **Visual Design:**
  - 🥇 1st Place: Gold trophy with special gradient
  - 🥈 2nd Place: Silver medal styling
  - 🥉 3rd Place: Bronze badge
  - Ranks 4-10: Standard card design

**Calculation Logic:**
```typescript
For each student:
  1. Aggregate all graded submissions in the course
  2. Calculate: total_marks / total_possible_marks
  3. Convert to percentage
  4. Sort students by average percentage (descending)
  5. Display top 10
```

**Real-time Updates:**
- Automatically refreshes when new grades are added
- Updates immediately after teacher grades submission
- Reflects latest performance instantly

**Database Query:**
```sql
-- Pseudo-SQL for leaderboard calculation
SELECT
  student_id,
  SUM(grades.marks) as total_marks,
  SUM(assignments.max_marks) as max_possible,
  COUNT(*) as submission_count,
  (SUM(grades.marks) / SUM(assignments.max_marks)) * 100 as avg_percentage
FROM submissions
JOIN grades ON grades.submission_id = submissions.id
JOIN assignments ON assignments.id = submissions.assignment_id
WHERE assignments.course_id = ?
GROUP BY student_id
ORDER BY avg_percentage DESC
LIMIT 10
```

---

### 6. Real-Time Chat System

#### Course Discussion
**File:** `src/components/CourseChat.tsx`

**Features:**
- **Group Chat:**
  - All enrolled students + teacher can participate
  - Real-time message delivery
  - Automatic scrolling to latest message
  - User identification with name and role

- **Message Display:**
  - Teacher messages highlighted with "Teacher" badge
  - Own messages aligned right with blue gradient
  - Others' messages aligned left with gray background
  - Timestamps with smart formatting (Just now, 5m ago, 2h ago)

**Database Schema:**
```sql
forum_posts table:
  - id (uuid, primary key)
  - course_id (uuid, foreign key)
  - user_id (uuid, foreign key)
  - message (text)
  - file_url (text, nullable)
  - created_at (timestamp)
```

**Real-time Implementation:**
```typescript
// Supabase Realtime subscription
supabase
  .channel(`course_chat_${courseId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'forum_posts',
    filter: `course_id=eq.${courseId}`
  }, (payload) => {
    // Add new message to chat
  })
  .subscribe()
```

#### Direct Messaging (Infrastructure Ready)
**Database Schema:**
```sql
direct_messages table:
  - id (uuid, primary key)
  - sender_id (uuid, foreign key)
  - receiver_id (uuid, foreign key)
  - message (text)
  - file_url (text, nullable)
  - is_read (boolean, default: false)
  - created_at (timestamp)
```

**RLS Policies:**
- Users can only see messages where they are sender or receiver
- Only sender can create messages
- Only receiver can mark as read

---

### 7. Course Detail View

**File:** `src/pages/CourseDetail.tsx`

**Features:**
- **Tabbed Interface:**
  - Assignments tab
  - Submissions tab (teachers only)
  - Leaderboard tab
  - Chat tab

- **Assignment List:**
  - Status badges (Pending/Submitted/Graded/Overdue)
  - Due date display
  - Submit button for students
  - Grade display for completed work

- **Submission Management (Teachers):**
  - View all student submissions
  - Quick access to grading interface
  - See grading status at a glance
  - Update grades if needed

- **Navigation:**
  - Back to dashboard button
  - Breadcrumb trail
  - Course name in header

---

### 8. Dashboard Systems

#### Student Dashboard
**File:** `src/pages/StudentDashboard.tsx`

**Features:**
- **Enrolled Courses:**
  - Card view of all enrolled courses
  - Click to view course details
  - Progress indicators
  - Teacher information

- **All Courses:**
  - Browse available courses
  - Enroll with one click
  - Filter and search (ready for implementation)

- **Quick Stats:**
  - Total enrolled courses
  - Assignments pending
  - Recent grades

#### Teacher Dashboard
**File:** `src/pages/TeacherDashboard.tsx`

**Features:**
- **My Courses:**
  - All courses created by teacher
  - Enrollment count per course
  - Click to manage course

- **Create Course:**
  - Modal form for new course
  - Quick course creation
  - Automatic timestamp

- **Quick Stats:**
  - Total courses created
  - Total students enrolled
  - Pending submissions to grade

---

### 9. User Status Tracking (Infrastructure)

**Database Schema:**
```sql
user_status table:
  - user_id (uuid, primary key, foreign key)
  - is_online (boolean, default: false)
  - last_seen (timestamp)
  - updated_at (timestamp)
```

**Features (Ready for UI Integration):**
- Track online/offline status
- Last seen timestamp
- Auto-update on activity
- Display green dot for online users

**Trigger Function:**
```sql
-- Auto-update timestamp on status change
CREATE FUNCTION update_user_status_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

### 10. Notifications System

**Database Schema:**
```sql
notifications table:
  - id (uuid, primary key)
  - user_id (uuid, foreign key)
  - message (text)
  - type (text)
  - is_read (boolean, default: false)
  - created_at (timestamp)
```

**Notification Types:**
- New assignment posted
- Assignment graded
- New message in course chat
- Course enrollment confirmation
- Leaderboard position change

**Header Integration:**
- Bell icon with red dot for unread notifications
- Click to view notification dropdown
- Mark as read functionality

---

## UI/UX Design

### Theme System
**File:** `src/contexts/ThemeContext.tsx`

**Features:**
- Dark and light mode support
- Smooth transitions (300ms duration)
- System preference detection
- Persistent user choice (localStorage)
- Toggle from header

**Color Palette:**

**Light Mode:**
- Background: Gray-50
- Cards: White
- Text: Gray-800/Gray-600
- Accents: Blue-500, Purple-600

**Dark Mode:**
- Background: Gray-900/Gray-800
- Cards: Gray-800/Gray-700
- Text: White/Gray-400
- Accents: Blue-400, Purple-500

### Gradient Scheme
- **Blue-Purple:** Primary actions, headers
- **Green-Teal:** Success, submissions
- **Yellow-Orange:** Gold rank, warnings
- **Purple-Pink:** Platinum rank, premium features
- **Red-Orange:** Errors, urgent actions

### Responsive Design
- **Mobile:** Single column layout, stacked cards
- **Tablet:** 2-column grid for courses
- **Desktop:** 3-column grid, full sidebar navigation

---

## Security Features

### Authentication
- **Supabase Auth** with JWT tokens
- Email/password authentication
- Secure session management
- Auto logout on token expiry

### Row Level Security (RLS)

**Profiles:**
```sql
-- Users can view all profiles
-- Users can only update their own profile
```

**Courses:**
```sql
-- Everyone can view courses
-- Only teachers can create courses
-- Only course owner can update/delete
```

**Enrollments:**
```sql
-- Students can only enroll themselves
-- Students can only see their enrollments
-- Teachers can see enrollments in their courses
```

**Assignments:**
```sql
-- Students can view assignments in enrolled courses
-- Only teachers can create assignments
-- Only assignment creator can update/delete
```

**Submissions:**
```sql
-- Students can only create their own submissions
-- Students can only view their own submissions
-- Teachers can view all submissions in their courses
```

**Grades:**
```sql
-- Students can view their own grades
-- Teachers can grade submissions in their courses
-- Only the grading teacher can update grades
```

**Forum Posts:**
```sql
-- Only enrolled users can view course chat
-- Only enrolled users can post messages
-- Users can only delete their own messages
```

**Direct Messages:**
```sql
-- Users can only view messages they sent or received
-- Users can only send messages (not create for others)
-- Only receiver can mark message as read
```

### Data Validation
- Input sanitization on client and server
- File size limits (10MB for uploads)
- URL validation for external links
- Required field validation
- Type checking with TypeScript

---

## Database Architecture

### Entity Relationship Diagram

```
profiles (users)
    ↓
    ├─ courses (teacher creates)
    │     ↓
    │     ├─ enrollments (students enroll)
    │     ├─ assignments (teacher creates)
    │     │     ↓
    │     │     └─ submissions (students submit)
    │     │           ↓
    │     │           └─ grades (teacher evaluates)
    │     └─ forum_posts (course chat)
    │
    ├─ direct_messages (private chat)
    ├─ user_status (online tracking)
    └─ notifications (alerts)
```

### Key Relationships

**One-to-Many:**
- One teacher → Many courses
- One course → Many assignments
- One course → Many enrollments
- One assignment → Many submissions
- One user → Many notifications

**One-to-One:**
- One submission → One grade (unique constraint)
- One user → One user_status

**Many-to-Many:**
- Students ↔ Courses (via enrollments table)

---

## Technical Stack

### Frontend
- **React 18.3** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Icon library

### Backend
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication service
  - Real-time subscriptions
  - Row Level Security
  - Storage (for file uploads)

### State Management
- **React Context API**
  - AuthContext (user and profile)
  - ThemeContext (dark/light mode)

### Real-time Features
- **Supabase Realtime**
  - Live chat updates
  - Presence tracking
  - Database change subscriptions

---

## File Structure

```
src/
├── components/
│   ├── AssignmentModal.tsx       # Create assignment form
│   ├── AuthForm.tsx               # Login/signup form
│   ├── CourseCard.tsx             # Course display card
│   ├── CourseChat.tsx             # Real-time course chat
│   ├── GradingModal.tsx           # Teacher grading interface
│   ├── Header.tsx                 # Top navigation bar
│   ├── Leaderboard.tsx            # Student rankings
│   ├── ProfileModal.tsx           # Edit user profile
│   └── SubmissionModal.tsx        # Student submission form
│
├── contexts/
│   ├── AuthContext.tsx            # Authentication state
│   └── ThemeContext.tsx           # Theme management
│
├── pages/
│   ├── CourseDetail.tsx           # Full course view
│   ├── LandingPage.tsx            # Welcome/intro page
│   ├── StudentDashboard.tsx       # Student home
│   └── TeacherDashboard.tsx       # Teacher home
│
├── lib/
│   ├── database.types.ts          # TypeScript types
│   └── supabase.ts                # Supabase client
│
├── App.tsx                        # Main app component
└── main.tsx                       # App entry point
```

---

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project

### Environment Variables
Create `.env` file:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Installation
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Type checking
npm run typecheck
```

### Database Setup
All migrations are in `supabase/migrations/` directory:
1. `20251014163355_create_lms_schema.sql` - Initial schema
2. `20251016181728_add_enhanced_features.sql` - Enhanced features
3. Migration files auto-applied via Supabase MCP tools

---

## Future Enhancements

### Ready for Implementation (Database Support Exists)

1. **File Uploads:**
   - Supabase Storage integration
   - Assignment file attachments
   - Chat file sharing
   - Profile photo storage

2. **YouTube Video Integration:**
   - Embed videos in course view
   - Video URL field exists in courses table
   - Player controls and timestamps

3. **Classmate Directory:**
   - View profiles of students in same course
   - Filter by name, rank, or activity
   - Connect and message directly

4. **Online Status:**
   - Green dot for online users
   - Last seen timestamp
   - Presence in chat

5. **Direct Messaging:**
   - Private chat between users
   - File sharing in DMs
   - Read receipts

6. **Advanced Analytics:**
   - Performance graphs
   - Progress tracking charts
   - Completion percentages

7. **Topper Celebration:**
   - Animated congratulations for top 3
   - Special badges and achievements
   - Fireworks or confetti animation

8. **Enhanced Notifications:**
   - Email notifications
   - Push notifications
   - In-app notification center

### Stretch Features

- **Live Classes:** Video conferencing integration
- **Calendar View:** Assignment deadlines on calendar
- **Mobile App:** React Native companion app
- **AI Assistant:** Chatbot for student help
- **Plagiarism Check:** Assignment similarity detection
- **Certificate Generation:** Course completion certificates
- **Payment Integration:** Paid courses support
- **Multi-language:** Internationalization support

---

## API Documentation

### Supabase Client Usage

#### Authentication
```typescript
// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password'
});

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

// Sign out
await supabase.auth.signOut();

// Get current user
const { data: { user } } = await supabase.auth.getUser();
```

#### Database Queries
```typescript
// Fetch courses
const { data, error } = await supabase
  .from('courses')
  .select('*')
  .order('created_at', { ascending: false });

// Create assignment
const { error } = await supabase
  .from('assignments')
  .insert({
    course_id: courseId,
    title: 'Assignment 1',
    description: 'Description here',
    due_date: new Date().toISOString(),
    max_marks: 100
  });

// Update profile
const { error } = await supabase
  .from('profiles')
  .update({ name: 'New Name' })
  .eq('id', userId);
```

#### Real-time Subscriptions
```typescript
// Subscribe to chat messages
const channel = supabase
  .channel('course_chat')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'forum_posts',
    filter: `course_id=eq.${courseId}`
  }, (payload) => {
    console.log('New message:', payload.new);
  })
  .subscribe();

// Cleanup
supabase.removeChannel(channel);
```

---

## Testing Checklist

### Student Flow
- [ ] View landing page
- [ ] Sign up as student
- [ ] Browse available courses
- [ ] Enroll in a course
- [ ] View course details
- [ ] Submit an assignment
- [ ] Participate in course chat
- [ ] Check leaderboard
- [ ] Edit profile with social links
- [ ] View graded assignments

### Teacher Flow
- [ ] Sign up as teacher
- [ ] Create a new course
- [ ] View enrolled students
- [ ] Create an assignment
- [ ] View student submissions
- [ ] Grade a submission
- [ ] See leaderboard update
- [ ] Participate in course chat
- [ ] Update course details
- [ ] Edit profile

### UI/UX Testing
- [ ] Toggle dark/light theme
- [ ] Test responsive design on mobile
- [ ] Check animations on landing page
- [ ] Verify smooth transitions
- [ ] Test form validations
- [ ] Check loading states
- [ ] Verify error messages

---

## Performance Optimization

### Current Optimizations
- React component memoization
- Efficient database queries with proper indexes
- Lazy loading for modals
- Debounced search inputs (ready to implement)
- Image optimization (base64 for small images)

### Future Optimizations
- Virtual scrolling for long lists
- Infinite scroll for courses
- Code splitting by route
- Service worker for offline support
- CDN for static assets

---

## Deployment

### Production Build
```bash
npm run build
# Output in dist/ directory
```

### Deployment Platforms
- **Vercel** (Recommended for React)
- **Netlify** (Easy setup)
- **GitHub Pages** (Free hosting)
- **Cloudflare Pages** (Fast CDN)

### Environment Setup
1. Set environment variables in platform
2. Connect GitHub repository
3. Configure build command: `npm run build`
4. Set publish directory: `dist`

---

## Support & Maintenance

### Common Issues

**Build Errors:**
- Run `npm install` to ensure dependencies
- Check Node.js version (18+ required)
- Clear `node_modules` and reinstall

**Authentication Issues:**
- Verify Supabase environment variables
- Check RLS policies are enabled
- Ensure email confirmation is disabled in Supabase

**Real-time Not Working:**
- Enable Realtime in Supabase project settings
- Check RLS policies allow SELECT
- Verify channel subscription is active

---

## License & Credits

**Built with:**
- React.js and TypeScript
- Supabase for backend
- Tailwind CSS for styling
- Lucide React for icons

**Author:** LearnHub Development Team
**Version:** 1.0.0
**Last Updated:** October 2024

---

## Conclusion

LearnHub is a feature-rich, production-ready Learning Management System with:
- ✅ 10+ core features implemented
- ✅ Beautiful, responsive UI with animations
- ✅ Real-time collaboration capabilities
- ✅ Secure authentication and authorization
- ✅ Intelligent grading and ranking system
- ✅ Comprehensive database architecture
- ✅ Ready for scaling and enhancement

Perfect for educational institutions, online courses, and corporate training programs!

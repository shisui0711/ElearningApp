# E-Learning System Use Cases

This directory contains detailed use case diagrams and specifications for each implemented feature of the e-learning system. Each file includes:

1. A PlantUML diagram showing the use case and its relationships
2. A detailed use case specification with:
   - Use case name
   - Actors involved
   - Description
   - Preconditions
   - Postconditions
   - Main flow of events
   - Alternative flows
   - Exception flows

## Use Case Files

### Authentication
- [User Authentication](userauth.puml) - Authentication process for all user types

### Course Management
- [Course Management](coursemanagement.puml) - Course creation and management by teachers
- [Course Enrollment](courseenrollment.puml) - Student enrollment in courses

### Assessment
- [Teacher Exam Management](teacher_exam_management.puml) - Creating and grading exams by teachers
- [Student Exam Taking](student_exam_taking.puml) - Taking and viewing results of exams by students

### Community
- [Forum Interaction](foruminteraction.puml) - Discussion forums and interactions

### Administration
- [Admin User Management](adminusermanagement.puml) - User, class, and department management
- [Analytics](analytics.puml) - System analytics and reporting

## Database Model Integration

These use cases are built based on the actual database schema, which includes the following main entities:
- User (with Student, Teacher roles)
- Course, Lesson, Document
- Enrollment, CompletedLesson
- Exam, Question, Answer, ExamAttempt
- Assignment, AssignmentSubmission
- Forum entities (Category, Topic, Post, Like)
- Organizational entities (Department, Class, Subject)

## How to Use

1. Open these files with a PlantUML-compatible editor or viewer
2. Review the diagrams and detailed specifications
3. Use as reference for implementation and testing
4. Add new use case files following the same template structure

## Template

A [template file](template.puml) is provided to create additional use case specifications following the same format. 
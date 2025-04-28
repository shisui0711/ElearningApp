/**
 * @swagger
 * components:
 *   schemas:
 *     Course:
 *       type: object
 *       required:
 *         - id
 *         - name
 *         - description
 *         - departmentId
 *         - teacherId
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the course
 *         name:
 *           type: string
 *           description: Course name
 *         description:
 *           type: string
 *           description: Course description
 *         imageUrl:
 *           type: string
 *           description: Course image URL
 *         departmentId:
 *           type: string
 *           description: Department ID this course belongs to
 *         teacherId:
 *           type: string
 *           description: Teacher ID who created this course
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the course was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the course was last updated
 *     
 *     User:
 *       type: object
 *       required:
 *         - id
 *         - email
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the user
 *         email:
 *           type: string
 *           format: email
 *           description: User email
 *         displayName:
 *           type: string
 *           description: User display name
 *         avatarUrl:
 *           type: string
 *           description: User avatar URL
 *         role:
 *           type: string
 *           enum: [STUDENT, TEACHER, ADMIN]
 *           description: User role
 *     
 *     Teacher:
 *       type: object
 *       required:
 *         - id
 *         - userId
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the teacher
 *         userId:
 *           type: string
 *           description: User ID associated with this teacher
 *         bio:
 *           type: string
 *           description: Teacher biography
 *         user:
 *           $ref: '#/components/schemas/User'
 *     
 *     Student:
 *       type: object
 *       required:
 *         - id
 *         - userId
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the student
 *         userId:
 *           type: string
 *           description: User ID associated with this student
 *         user:
 *           $ref: '#/components/schemas/User'
 *     
 *     Department:
 *       type: object
 *       required:
 *         - id
 *         - name
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the department
 *         name:
 *           type: string
 *           description: Department name
 *     
 *     Lesson:
 *       type: object
 *       required:
 *         - id
 *         - title
 *         - courseId
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the lesson
 *         title:
 *           type: string
 *           description: Lesson title
 *         description:
 *           type: string
 *           description: Lesson description
 *         content:
 *           type: string
 *           description: Lesson content
 *         videoUrl:
 *           type: string
 *           description: Lesson video URL
 *         position:
 *           type: integer
 *           description: Lesson position in the course
 *         courseId:
 *           type: string
 *           description: Course ID this lesson belongs to
 *     
 *     Assignment:
 *       type: object
 *       required:
 *         - id
 *         - title
 *         - courseId
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the assignment
 *         title:
 *           type: string
 *           description: Assignment title
 *         description:
 *           type: string
 *           description: Assignment description
 *         dueDate:
 *           type: string
 *           format: date-time
 *           description: Assignment due date
 *         courseId:
 *           type: string
 *           description: Course ID this assignment belongs to
 *     
 *     Exam:
 *       type: object
 *       required:
 *         - id
 *         - title
 *         - courseId
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the exam
 *         title:
 *           type: string
 *           description: Exam title
 *         description:
 *           type: string
 *           description: Exam description
 *         duration:
 *           type: integer
 *           description: Exam duration in minutes
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: Exam start date and time
 *         courseId:
 *           type: string
 *           description: Course ID this exam belongs to
 *
 *     Question:
 *       type: object
 *       required:
 *         - id
 *         - text
 *         - type
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the question
 *         text:
 *           type: string
 *           description: Question text
 *         type:
 *           type: string
 *           enum: [MULTIPLE_CHOICE, SINGLE_CHOICE, TEXT]
 *           description: Question type
 *         options:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               text:
 *                 type: string
 *               isCorrect:
 *                 type: boolean
 *
 *     Class:
 *       type: object
 *       required:
 *         - id
 *         - name
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the class
 *         name:
 *           type: string
 *           description: Class name
 *         description:
 *           type: string
 *           description: Class description
 *
 *     AssignmentSubmission:
 *       type: object
 *       required:
 *         - id
 *         - assignmentId
 *         - studentId
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the submission
 *         assignmentId:
 *           type: string
 *           description: Assignment ID this submission belongs to
 *         studentId:
 *           type: string
 *           description: Student ID who submitted this assignment
 *         fileUrl:
 *           type: string
 *           description: URL to the submitted file
 *         content:
 *           type: string
 *           description: Text content of the submission
 *         grade:
 *           type: number
 *           description: Grade given to the submission
 *         feedback:
 *           type: string
 *           description: Teacher's feedback on the submission
 *         submittedAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the submission was made
 *
 *     Pagination:
 *       type: object
 *       properties:
 *         pageNumber:
 *           type: integer
 *           description: Current page number
 *         pageSize:
 *           type: integer
 *           description: Number of items per page
 *         totalCount:
 *           type: integer
 *           description: Total number of items
 *         totalPages:
 *           type: integer
 *           description: Total number of pages
 *         hasNextPage:
 *           type: boolean
 *           description: Whether there is a next page
 *         hasPreviousPage:
 *           type: boolean
 *           description: Whether there is a previous page
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Error message
 *
 *   responses:
 *     UnauthorizedError:
 *       description: Access token is missing or invalid
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *     ForbiddenError:
 *       description: The user doesn't have permission to access the resource
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *     NotFoundError:
 *       description: The requested resource was not found
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *     ValidationError:
 *       description: The request data failed validation
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *     ServerError:
 *       description: Internal server error
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 */

// This file is only for Swagger documentation
// It doesn't export anything
export {}; 
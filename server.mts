import { createServer } from "http";
import next from "next";
import { Server } from "socket.io";

interface JoinLessonRoomData {
  lessonId: string;
  userId: string;
}

interface JoinCourseRoomData {
  courseId: string;
  userId: string;
}

interface NotificationData {
  userId: string;
  type: string;
  message: string;
  title?: string;
  link?: string;
  isRead?: boolean;
  createdAt?: Date;
}

interface CommentData {
  lessonId: string;
  userId: string;
  content: string;
}

interface CourseCommentData {
  courseId: string;
  userId: string;
  content: string;
  parentId?: string | null;
}

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(handle);
  const io = new Server(server, {
    path: "/api/socket",
    addTrailingSlash: false,
    cors: { origin: "*" },
  });

  io.on("connect", (socket) => {
    console.log("Socket connected:", socket.id);
    
    // Handle joining a user-specific room
    socket.on("join_user_room", ({ userId }: { userId: string }) => {
      console.log(`User ${socket.id} joined their user room: ${userId}`);
      socket.join(userId);
    });

    socket.on("send_notification", (data: NotificationData) => {
      console.log("Sending notification:", data);
      io.to(data.userId).emit("notification_received", data);
    });

    // Handle joining a lesson room
    socket.on("join_lesson", ({ lessonId }: JoinLessonRoomData) => {
      console.log(`User ${socket.id} joined lesson room: ${lessonId}`);
      socket.join(`lesson:${lessonId}`);
    });

    // Handle leaving a lesson room
    socket.on("leave_lesson", ({ lessonId }: { lessonId: string }) => {
      console.log(`User ${socket.id} left lesson room: ${lessonId}`);
      socket.leave(`lesson:${lessonId}`);
    });

    // Handle new comment
    socket.on("new_comment", (data: CommentData) => {
      console.log(
        `New comment in lesson ${data.lessonId} from user ${data.userId}`
      );
      // Broadcast to all users in the lesson room
      io.to(`lesson:${data.lessonId}`).emit("comment_received", data);
    });

    // Handle joining a course room
    socket.on("join_course", ({ courseId }: JoinCourseRoomData) => {
      console.log(`User ${socket.id} joined course room: ${courseId}`);
      socket.join(`course:${courseId}`);
    });

    // Handle leaving a course room
    socket.on("leave_course", ({ courseId }: { courseId: string }) => {
      console.log(`User ${socket.id} left course room: ${courseId}`);
      socket.leave(`course:${courseId}`);
    });

    // Handle new course comment
    socket.on("new_course_comment", (data: CourseCommentData) => {
      console.log(
        `New comment in course ${data.courseId} from user ${data.userId}`
      );
      // Broadcast to all users in the course room
      io.to(`course:${data.courseId}`).emit("course_comment_received", data);
    });

    socket.on("disconnect", async () => {
      console.log("Socket disconnected:", socket.id);
    });
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});

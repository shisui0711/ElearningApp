import { createSwaggerSpec } from 'next-swagger-doc';

// Importing this to make sure Swagger picks up the schema definitions
import './swagger-schemas';

interface ApiDocType {
  paths: Record<string, any>;
  [key: string]: any;
}

const apiConfig = {
  openapi: '3.0.0',
  info: {
    title: 'E-Learning API Documentation',
    version: '1.0.0',
    description: 'API documentation for E-Learning application',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server',
    },
    {
      url: '',
      description: 'Production server',
    }
  ],
  tags: [
    {
      name: 'Users',
      description: 'User related endpoints',
    },
    {
      name: 'Courses',
      description: 'Course related endpoints',
    },
    {
      name: 'Lessons',
      description: 'Lesson related endpoints',
    },
    {
      name: 'Assignments',
      description: 'Assignment related endpoints',
    },
    {
      name: 'Exams',
      description: 'Exam related endpoints',
    },
    {
      name: 'Students',
      description: 'Student related endpoints',
    },
    {
      name: 'Teachers',
      description: 'Teacher related endpoints',
    },
    {
      name: 'Classes',
      description: 'Class related endpoints',
    },
    {
      name: 'Documents',
      description: 'Document related endpoints',
    },
    {
      name: 'Forum',
      description: 'Forum related endpoints',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
};

export const getSwaggerSpec = () => {
  const spec = createSwaggerSpec({
    definition: apiConfig,
    apiFolder: 'app/api', // Updated path to the API routes directory
    // This transformation prevents the duplication of /api in paths
    transformApiDoc: (apiDoc: ApiDocType) => {
      // Create a deep copy of the apiDoc object
      const apiDocCopy: ApiDocType = JSON.parse(JSON.stringify(apiDoc));
      
      // If paths object exists
      if (apiDocCopy.paths) {
        const newPaths: Record<string, any> = {};
        
        // Iterate through all paths
        Object.keys(apiDocCopy.paths).forEach(path => {
          // If the path starts with /api, replace with just /
          const newPath = path.replace(/^\/api\//, '/');
          newPaths[newPath] = apiDocCopy.paths[path];
        });
        
        // Replace paths with the corrected ones
        apiDocCopy.paths = newPaths;
      }
      
      return apiDocCopy;
    }
  });
  return spec;
};
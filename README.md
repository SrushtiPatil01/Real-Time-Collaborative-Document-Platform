# Real-Time-Collaborative-Document-Platform

## Project Summary

A web application enabling real-time collaborative document editing with secure user access, built with TypeScript, Node.js, React, MongoDB, and WebSockets. The platform supports multiple concurrent users per document with low-latency updates and scalable cloud integration.


## Overview
- Built with Node.js & TypeScript for backend APIs
- React frontend for interactive, real-time document editing
- MongoDB for storing document data and user information
- WebSockets for real-time multi-user collaboration
- JWT Authentication and role-based workspace isolation for secure access
- AWS S3 for file storage and AWS Lambda triggers for asynchronous processing
- Supports low-latency document updates (~180ms average per update)


## Tech Stack

- **Frontend:** React
- **Backend:** Node.js, TypeScript, Express.js
- **Database:** MongoDB
- **Real-Time Communication:** WebSockets
- **Cloud Services:** AWS S3, AWS Lambda
- **Authentication:** JWT


## Performance
- Average document update latency: ~180ms
- Supports multiple concurrent users per document without conflicts
- Scalable and cloud-ready architecture for real-time collaboration

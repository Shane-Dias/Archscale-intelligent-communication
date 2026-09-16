/**
 * Backward Compatibility Tests for Confidence Scores
 * 
 * Tests that the application functions correctly with legacy data
 * (tasks and decisions without confidence field)
 * 
 * Requirements: 5.4, 5.5, 5.6, 6.1, 6.2, 6.3, 6.4
 */

const mongoose = require('mongoose');
const Task = require('../models/Task');
const Decision = require('../models/Decision');
const Project = require('../models/Project');
const Conversation = require('../models/Conversation');

describe('Backward Compatibility with Legacy Data', () => {
  let projectId;
  let conversationId;

  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/archscale_test';
    await mongoose.connect(mongoUri);

    // Create a test project and conversation
    const project = await Project.create({
      name: 'Legacy Compatibility Test Project',
      description: 'Testing backward compatibility',
    });
    projectId = project._id;

    const conversation = await Conversation.create({
      projectId,
      summary: 'Legacy conversation for compatibility testing',
      messages: [{ role: 'user', content: 'Test conversation' }],
    });
    conversationId = conversation._id;
  });

  afterAll(async () => {
    // Clean up test data
    await Task.deleteMany({ projectId });
    await Decision.deleteMany({ projectId });
    await Conversation.findByIdAndDelete(conversationId);
    await Project.findByIdAndDelete(projectId);
    await mongoose.connection.close();
  });

  describe('Task Model Backward Compatibility', () => {
    test('should create task without confidence field', async () => {
      const task = await Task.create({
        projectId,
        conversationId,
        title: 'Legacy task without confidence',
        assignee: 'John Doe',
        status: 'pending',
      });

      expect(task).toBeDefined();
      expect(task._id).toBeDefined();
      expect(task.title).toBe('Legacy task without confidence');
      expect(task.confidence).toBeNull();
    });

    test('should query tasks without confidence field', async () => {
      // Create a legacy task
      await Task.create({
        projectId,
        conversationId,
        title: 'Query test legacy task',
        assignee: 'Jane Smith',
      });

      // Query all tasks
      const tasks = await Task.find({ projectId });
      
      expect(tasks).toBeDefined();
      expect(tasks.length).toBeGreaterThan(0);
      
      // Find the legacy task
      const legacyTask = tasks.find(t => t.title === 'Query test legacy task');
      expect(legacyTask).toBeDefined();
      expect(legacyTask.confidence).toBeNull();
    });

    test('should update task without modifying confidence field', async () => {
      // Create a legacy task
      const task = await Task.create({
        projectId,
        conversationId,
        title: 'Update test legacy task',
        status: 'pending',
      });

      expect(task.confidence).toBeNull();

      // Update the task
      task.status = 'in_progress';
      task.notes = 'Updated notes';
      await task.save();

      // Verify confidence remains null
      const updatedTask = await Task.findById(task._id);
      expect(updatedTask.status).toBe('in_progress');
      expect(updatedTask.notes).toBe('Updated notes');
      expect(updatedTask.confidence).toBeNull();
    });

    test('should handle mixed data - tasks with and without confidence', async () => {
      // Create tasks with different confidence states
      await Task.create([
        {
          projectId,
          conversationId,
          title: 'Task with high confidence',
          confidence: 0.9,
        },
        {
          projectId,
          conversationId,
          title: 'Task with medium confidence',
          confidence: 0.6,
        },
        {
          projectId,
          conversationId,
          title: 'Legacy task without confidence',
        },
        {
          projectId,
          conversationId,
          title: 'Task with explicit null confidence',
          confidence: null,
        },
      ]);

      // Query all tasks
      const tasks = await Task.find({ projectId }).sort({ createdAt: -1 }).limit(4);
      
      expect(tasks.length).toBe(4);
      
      // Verify each task
      const withHigh = tasks.find(t => t.title === 'Task with high confidence');
      expect(withHigh.confidence).toBe(0.9);

      const withMedium = tasks.find(t => t.title === 'Task with medium confidence');
      expect(withMedium.confidence).toBe(0.6);

      const legacy = tasks.find(t => t.title === 'Legacy task without confidence');
      expect(legacy.confidence).toBeNull();

      const explicitNull = tasks.find(t => t.title === 'Task with explicit null confidence');
      expect(explicitNull.confidence).toBeNull();
    });
  });

  describe('Decision Model Backward Compatibility', () => {
    test('should create decision without confidence field', async () => {
      const decision = await Decision.create({
        projectId,
        conversationId,
        type: 'decision',
        description: 'Legacy decision without confidence',
        decidedBy: 'Alice',
      });

      expect(decision).toBeDefined();
      expect(decision._id).toBeDefined();
      expect(decision.description).toBe('Legacy decision without confidence');
      expect(decision.confidence).toBeNull();
    });

    test('should query decisions without confidence field', async () => {
      // Create a legacy decision
      await Decision.create({
        projectId,
        conversationId,
        type: 'approval',
        description: 'Query test legacy decision',
        decidedBy: 'Bob',
      });

      // Query all decisions
      const decisions = await Decision.find({ projectId });
      
      expect(decisions).toBeDefined();
      expect(decisions.length).toBeGreaterThan(0);
      
      // Find the legacy decision
      const legacyDecision = decisions.find(d => d.description === 'Query test legacy decision');
      expect(legacyDecision).toBeDefined();
      expect(legacyDecision.confidence).toBeNull();
    });

    test('should update decision without modifying confidence field', async () => {
      // Create a legacy decision
      const decision = await Decision.create({
        projectId,
        conversationId,
        type: 'pending_approval',
        description: 'Update test legacy decision',
      });

      expect(decision.confidence).toBeNull();

      // Update the decision
      decision.type = 'approval';
      decision.decidedBy = 'Charlie';
      decision.notes = 'Approved after review';
      await decision.save();

      // Verify confidence remains null
      const updatedDecision = await Decision.findById(decision._id);
      expect(updatedDecision.type).toBe('approval');
      expect(updatedDecision.decidedBy).toBe('Charlie');
      expect(updatedDecision.notes).toBe('Approved after review');
      expect(updatedDecision.confidence).toBeNull();
    });

    test('should handle mixed data - decisions with and without confidence', async () => {
      // Create decisions with different confidence states
      await Decision.create([
        {
          projectId,
          conversationId,
          type: 'decision',
          description: 'Decision with high confidence',
          decidedBy: 'David',
          confidence: 0.95,
        },
        {
          projectId,
          conversationId,
          type: 'approval',
          description: 'Decision with low confidence',
          decidedBy: 'Eve',
          confidence: 0.3,
        },
        {
          projectId,
          conversationId,
          type: 'pending_approval',
          description: 'Legacy decision without confidence',
          decidedBy: 'Frank',
        },
        {
          projectId,
          conversationId,
          type: 'decision',
          description: 'Decision with explicit null confidence',
          decidedBy: 'Grace',
          confidence: null,
        },
      ]);

      // Query all decisions
      const decisions = await Decision.find({ projectId }).sort({ createdAt: -1 }).limit(4);
      
      expect(decisions.length).toBe(4);
      
      // Verify each decision
      const withHigh = decisions.find(d => d.description === 'Decision with high confidence');
      expect(withHigh.confidence).toBe(0.95);

      const withLow = decisions.find(d => d.description === 'Decision with low confidence');
      expect(withLow.confidence).toBe(0.3);

      const legacy = decisions.find(d => d.description === 'Legacy decision without confidence');
      expect(legacy.confidence).toBeNull();

      const explicitNull = decisions.find(d => d.description === 'Decision with explicit null confidence');
      expect(explicitNull.confidence).toBeNull();
    });
  });

  describe('Schema Validation', () => {
    test('should accept null confidence value explicitly', async () => {
      const task = await Task.create({
        projectId,
        conversationId,
        title: 'Task with explicit null',
        confidence: null,
      });

      expect(task.confidence).toBeNull();
    });

    test('should accept undefined confidence value implicitly', async () => {
      const task = await Task.create({
        projectId,
        conversationId,
        title: 'Task with undefined confidence',
        confidence: undefined,
      });

      expect(task.confidence).toBeNull();
    });

    test('should default to null when confidence is omitted', async () => {
      const task = await Task.create({
        projectId,
        conversationId,
        title: 'Task with omitted confidence',
      });

      expect(task.confidence).toBeNull();
    });
  });

  describe('API Response Format', () => {
    test('should include confidence field in response even when null', async () => {
      // Create a task without confidence
      const task = await Task.create({
        projectId,
        conversationId,
        title: 'API response test task',
      });

      // Convert to JSON (simulating API response)
      const json = task.toJSON();

      expect(json).toHaveProperty('confidence');
      expect(json.confidence).toBeNull();
    });

    test('should handle populated queries with null confidence', async () => {
      // Create a task without confidence
      await Task.create({
        projectId,
        conversationId,
        title: 'Populated query test task',
      });

      // Query with population (as done in API routes)
      const tasks = await Task.find({ projectId })
        .populate('conversationId')
        .populate('projectId');

      expect(tasks.length).toBeGreaterThan(0);
      
      const testTask = tasks.find(t => t.title === 'Populated query test task');
      expect(testTask).toBeDefined();
      expect(testTask.confidence).toBeNull();
      expect(testTask.conversationId).toBeDefined();
      expect(testTask.projectId).toBeDefined();
    });
  });
});

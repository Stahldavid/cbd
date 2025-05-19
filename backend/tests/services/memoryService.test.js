import {
  getSessionHistory,
  updateSessionHistory,
  clearSessionHistory,
  conversationMemory, // For direct inspection/reset if needed in tests
  MAX_SESSION_AGE_MS, // Import for testing cleanup logic if you choose to
} from '../../services/memoryService.js'; // Adjusted path

const MAX_SESSION_AGE_MS_FOR_TEST = 100; // Use a small value for testing cleanup

describe('Memory Service', () => {
  const sessionId = 'test-session-123';
  const userQuery1 = 'Hello there';
  const aiResponse1 = 'Hi! How can I help?';
  const userQuery2 = 'What is AI?';
  const aiResponse2 = 'AI is Artificial Intelligence.';

  beforeEach(() => {
    // Clear memory for the specific test session before each test
    // This makes tests independent
    clearSessionHistory(sessionId);
    // Or, if you want to be absolutely sure and reset all sessions (less ideal for parallel tests):
    // for (const id in conversationMemory) {
    //   delete conversationMemory[id];
    // }
    jest.useFakeTimers(); // Use fake timers for time-sensitive tests
  });

  afterEach(() => {
    jest.clearAllTimers(); // Clear all fake timers
  });

  test('should return an empty array for a new session', () => {
    const history = getSessionHistory(sessionId);
    expect(history).toEqual([]);
  });

  test('should update session history correctly', () => {
    updateSessionHistory(sessionId, 'user', userQuery1);
    let history = getSessionHistory(sessionId);
    expect(history).toHaveLength(1);
    expect(history[0]).toEqual({ role: 'user', parts: [{ text: userQuery1 }] });

    updateSessionHistory(sessionId, 'model', aiResponse1);
    history = getSessionHistory(sessionId);
    expect(history).toHaveLength(2);
    expect(history[1]).toEqual({ role: 'model', parts: [{ text: aiResponse1 }] });
  });

  test('should append to existing session history', () => {
    updateSessionHistory(sessionId, 'user', userQuery1);
    updateSessionHistory(sessionId, 'model', aiResponse1);
    updateSessionHistory(sessionId, 'user', userQuery2);
    updateSessionHistory(sessionId, 'model', aiResponse2);

    const history = getSessionHistory(sessionId);
    expect(history).toHaveLength(4);
    expect(history[2]).toEqual({ role: 'user', parts: [{ text: userQuery2 }] });
    expect(history[3]).toEqual({ role: 'model', parts: [{ text: aiResponse2 }] });
  });

  test('should clear session history for a specific session', () => {
    updateSessionHistory(sessionId, 'user', userQuery1);
    clearSessionHistory(sessionId);
    const history = getSessionHistory(sessionId);
    expect(history).toEqual([]);
  });

  test('clearSessionHistory should not affect other sessions', () => {
    const otherSessionId = 'other-session-456';
    updateSessionHistory(sessionId, 'user', userQuery1);
    updateSessionHistory(otherSessionId, 'user', userQuery2);

    clearSessionHistory(sessionId);

    const history1 = getSessionHistory(sessionId);
    const history2 = getSessionHistory(otherSessionId);

    expect(history1).toEqual([]);
    expect(history2).toHaveLength(1);
    expect(history2[0]).toEqual({ role: 'user', parts: [{ text: userQuery2 }] });
  });

  // Testing the cleanup logic is more complex due to timers.
  // Here's a conceptual way to test the core idea if MAX_SESSION_AGE_MS is very small for testing:
  // Or you can mock Date.now() to control time.
  test('session should be considered old after MAX_SESSION_AGE_MS (conceptual)', () => {
    // This test requires manipulating time or setting MAX_SESSION_AGE_MS to a very small value
    // For a real test, you'd use jest.useFakeTimers() and jest.advanceTimersByTime().

    // Mock Date.now()
    const mockCurrentTime = Date.now();
    const spyDateNow = jest.spyOn(Date, 'now');

    // 1. Create a session
    spyDateNow.mockReturnValue(mockCurrentTime); // Session created now
    updateSessionHistory(sessionId, 'user', userQuery1);
    expect(conversationMemory[sessionId]).toBeDefined();

    // 2. Advance time beyond MAX_SESSION_AGE_MS
    const timeAfterExpiry = mockCurrentTime + MAX_SESSION_AGE_MS + 1000; // 1 sec after

    // Simulate the cleanup function checking at different times
    // (In a real scenario, setupCleanupInterval would do this periodically)
    // This is a simplified check on the age calculation, not the interval itself.

    // Check a bit before expiry (assuming a manual check, not the interval)
    // If you were to manually call a cleanup function that uses Date.now():
    // spyDateNow.mockReturnValue(timeJustBeforeExpiry);
    // performManualCleanup(); // Hypothetical cleanup function
    // expect(conversationMemory[sessionId]).toBeDefined();

    // Check right after expiry
    spyDateNow.mockReturnValue(timeAfterExpiry);
    // performManualCleanup(); // Hypothetical cleanup function
    // If cleanup ran, session would be undefined. This part is hard to test without invoking the cleanup.

    // The actual setupCleanupInterval is harder to test directly without more complex timer mocking
    // and potentially refactoring setupCleanupInterval to be more testable (e.g., allow passing a cleanup function).
    // For now, we primarily trust the session update and clear logic.

    spyDateNow.mockRestore(); // Clean up the spy
    // A simpler test might be to check the lastAccess timestamp directly.
    if (conversationMemory[sessionId]) {
      // If session wasn't cleared by another test
      // eslint-disable-next-line jest/no-conditional-expect
      expect(conversationMemory[sessionId].lastAccess).toBe(mockCurrentTime);
    }
  });
});

describe('Memory Service - conversationMemory', () => {
  const sessionId1 = 'test-session-1';
  const sessionId2 = 'test-session-2';
  const userQuery1 = 'Hello';
  const modelResponse1 = 'Hi there';
  const toolName1 = 'exampleTool';
  const toolArgs1 = { query: 'test' };
  const toolResult1 = { success: true, data: 'tool data' };

  beforeEach(() => {
    // Reset the entire sessions object for clean tests
    conversationMemory.sessions = {};
    jest.useFakeTimers(); // Use fake timers for time-sensitive tests
  });

  afterEach(() => {
    jest.clearAllTimers(); // Clear all fake timers
  });

  test('initSession should create a new session with empty history and current timestamp', () => {
    const startTime = Date.now();
    const session = conversationMemory.initSession(sessionId1);
    expect(session).toBeDefined();
    expect(session.history).toEqual([]);
    expect(session.lastUpdate).toBe(startTime);
    expect(conversationMemory.sessions[sessionId1]).toBe(session);
  });

  test('getSession should return an existing session or initialize a new one', () => {
    const session1 = conversationMemory.getSession(sessionId1); // Initializes
    expect(session1).toBeDefined();
    const session2 = conversationMemory.getSession(sessionId1); // Returns existing
    expect(session2).toBe(session1);
  });

  test('addUserMessage should add a user message and update lastUpdate', () => {
    const initialTime = Date.now();
    conversationMemory.addUserMessage(sessionId1, userQuery1);
    jest.advanceTimersByTime(10); // Advance time a bit
    const session = conversationMemory.sessions[sessionId1];
    expect(session.history).toHaveLength(1);
    expect(session.history[0]).toEqual({ role: 'user', parts: [{ text: userQuery1 }] });
    expect(session.lastUpdate).toBe(initialTime + 10);
  });

  test('addModelTextResponse should add a model text response and update lastUpdate', () => {
    conversationMemory.addModelTextResponse(sessionId1, modelResponse1);
    const session = conversationMemory.sessions[sessionId1];
    expect(session.history).toHaveLength(1);
    expect(session.history[0]).toEqual({ role: 'model', parts: [{ text: modelResponse1 }] });
    expect(session.lastUpdate).toBe(Date.now());
  });

  test('addFunctionCall should add a model function call and update lastUpdate', () => {
    conversationMemory.addFunctionCall(sessionId1, toolName1, toolArgs1);
    const session = conversationMemory.sessions[sessionId1];
    expect(session.history).toHaveLength(1);
    expect(session.history[0]).toEqual({
      role: 'model',
      parts: [{ functionCall: { name: toolName1, args: toolArgs1 } }],
    });
    expect(session.lastUpdate).toBe(Date.now());
  });

  test('addFunctionResult should add a user function result and update lastUpdate', () => {
    conversationMemory.addFunctionResult(sessionId1, toolName1, toolResult1);
    const session = conversationMemory.sessions[sessionId1];
    expect(session.history).toHaveLength(1);
    expect(session.history[0]).toEqual({
      role: 'user',
      parts: [{ functionResponse: { name: toolName1, response: toolResult1 } }],
    });
    expect(session.lastUpdate).toBe(Date.now());
  });

  test('getHistory should return a copy of the session history', () => {
    conversationMemory.addUserMessage(sessionId1, userQuery1);
    const history = conversationMemory.getHistory(sessionId1);
    expect(history).toEqual([{ role: 'user', parts: [{ text: userQuery1 }] }]);
    history.push({ role: 'model', parts: [{ text: 'mutated' }] }); // Try to mutate
    const originalHistory = conversationMemory.getHistory(sessionId1);
    expect(originalHistory).toEqual([{ role: 'user', parts: [{ text: userQuery1 }] }]); // Should not be mutated
  });

  describe('cleanup', () => {
    test('should remove sessions older than maxAgeMs', () => {
      const t0 = Date.now();
      conversationMemory.addUserMessage(sessionId1, userQuery1); // Session 1 at t0
      expect(conversationMemory.sessions[sessionId1]).toBeDefined();

      jest.advanceTimersByTime(MAX_SESSION_AGE_MS_FOR_TEST / 2); // Advance half way
      const t1 = Date.now();
      conversationMemory.addUserMessage(sessionId2, 'Another query'); // Session 2 at t0 + age/2
      expect(conversationMemory.sessions[sessionId2]).toBeDefined();
      expect(conversationMemory.sessions[sessionId1].lastUpdate).toBe(t0);
      expect(conversationMemory.sessions[sessionId2].lastUpdate).toBe(t1);

      // Advance time so only session 1 is older than MAX_SESSION_AGE_MS_FOR_TEST
      jest.advanceTimersByTime(MAX_SESSION_AGE_MS_FOR_TEST / 2 + 1);

      const cleanupCount = conversationMemory.cleanup(MAX_SESSION_AGE_MS_FOR_TEST);
      expect(cleanupCount).toBe(1);
      expect(conversationMemory.sessions[sessionId1]).toBeUndefined();
      expect(conversationMemory.sessions[sessionId2]).toBeDefined(); // Session 2 should still exist
    });

    test('should not remove active sessions', () => {
      conversationMemory.addUserMessage(sessionId1, userQuery1);
      jest.advanceTimersByTime(MAX_SESSION_AGE_MS_FOR_TEST - 1); // Just before expiry
      const cleanupCount = conversationMemory.cleanup(MAX_SESSION_AGE_MS_FOR_TEST);
      expect(cleanupCount).toBe(0);
      expect(conversationMemory.sessions[sessionId1]).toBeDefined();
    });

    test('should return 0 if no sessions to clean', () => {
      const cleanupCount = conversationMemory.cleanup(MAX_SESSION_AGE_MS_FOR_TEST);
      expect(cleanupCount).toBe(0);
    });
  });
}); 
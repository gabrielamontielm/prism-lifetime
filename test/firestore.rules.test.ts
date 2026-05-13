import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { describe, it, beforeAll, beforeEach, afterAll } from "vitest";
import { readFileSync } from "fs";

/**
 * UNIT TESTS FOR FIRESTORE SECURITY RULES
 * 
 * These tests ensure that our "Master Gate" pattern correctly protects
 * user data from unauthorized access or identity spoofing.
 */

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "lifeprism-test",
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
      host: "localhost",
      port: 8080,
    },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe("LifePrism Security Rules", () => {
  const aliceId = "alice_123";
  const bobId = "bob_456";

  it("denies access to unauthenticated users", async () => {
    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(unauthedDb.collection("events").get());
  });

  it("allows a user to read events they are a participant of", async () => {
    // Setup: Admin creates an event where Alice is a participant
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection("events").doc("event_1").set({
        title: "Alice's Graduation",
        participants: [aliceId],
        authorId: bobId,
        date: "2024-05-13"
      });
    });

    const aliceDb = testEnv.authenticatedContext(aliceId).firestore();
    await assertSucceeds(aliceDb.collection("events").doc("event_1").get());
  });

  it("denies a user from reading events they are NOT a participant of", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection("events").doc("private_event").set({
        title: "Bob's Private Party",
        participants: [bobId],
        authorId: bobId,
        date: "2024-05-13"
      });
    });

    const aliceDb = testEnv.authenticatedContext(aliceId).firestore();
    await assertFails(aliceDb.collection("events").doc("private_event").get());
  });

  it("prevents identity spoofing (Alice cannot create an event as Bob)", async () => {
    const aliceDb = testEnv.authenticatedContext(aliceId).firestore();
    await assertFails(aliceDb.collection("events").add({
      title: "Malicious Event",
      authorId: bobId, // Spoofing Bob
      participants: [bobId],
      date: "2024-05-13"
    }));
  });
});

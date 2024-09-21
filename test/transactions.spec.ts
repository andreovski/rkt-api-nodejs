import { app } from "../src/app";
import supertest from "supertest";
import { afterAll, beforeAll, expect, it, describe, beforeEach } from "vitest";
import { execSync } from "node:child_process";

describe("🔸 Transactions", () => {
  // Start the server before all tests
  beforeAll(async () => {
    await app.ready();
  });

  // Close the server after all tests
  afterAll(async () => {
    await app.close();
  });

  // Reset the database before each test
  beforeEach(() => {
    execSync("yarn knex -- migrate:rollback --all");
    execSync("yarn knex -- migrate:latest");
  });

  it("should be able to create a new transaction", async () => {
    const response = await supertest(app.server).post("/transactions").send({
      title: "New trasaction",
      type: "credit",
      amount: 5000,
    });
    console.log("🚀 ~ response ~ response:", response.body);

    expect(response.status).toBe(201);
  });

  it("should be able to list all transactions", async () => {
    const createTransactionResponse = await supertest(app.server)
      .post("/transactions")
      .send({
        title: "New trasaction",
        type: "credit",
        amount: 5000,
      });

    const cookies = createTransactionResponse.get("Set-Cookie");

    const listTransactionsResponse = await supertest(app.server)
      .get("/transactions")
      .set("Cookie", cookies!)
      .expect(200);

    expect(listTransactionsResponse.body.transactions).toEqual([
      expect.objectContaining({
        title: "New trasaction",
        amount: 5000,
      }),
    ]);
  });

  it("should be able to get the specific transaction", async () => {
    const createTransactionResponse = await supertest(app.server)
      .post("/transactions")
      .send({
        title: "New trasaction",
        type: "credit",
        amount: 5000,
      });

    const cookies = createTransactionResponse.get("Set-Cookie");

    const listTransactionsResponse = await supertest(app.server)
      .get("/transactions")
      .set("Cookie", cookies!)
      .expect(200);

    const transactionId = listTransactionsResponse.body.transactions[0].id;

    const getTransactionResponse = await supertest(app.server)
      .get(`/transactions/${transactionId}`)
      .set("Cookie", cookies!)
      .expect(200);

    expect(getTransactionResponse.body.transaction).toEqual(
      expect.objectContaining({
        title: "New trasaction",
        amount: 5000,
      })
    );
  });

  it("should be able to get summary", async () => {
    const createTransactionResponse = await supertest(app.server)
      .post("/transactions")
      .send({
        title: "Credit transaction",
        type: "credit",
        amount: 5000,
      });

    const cookies = createTransactionResponse.get("Set-Cookie");

    await supertest(app.server)
      .post("/transactions")
      .set("Cookie", cookies!)
      .send({
        title: "Debit transaction",
        type: "debit",
        amount: 2000,
      });

    const summaryResponse = await supertest(app.server)
      .get("/transactions/summary")
      .set("Cookie", cookies!)
      .expect(200);

    expect(summaryResponse.body.summary).toEqual({
      amount: 3000,
    });
  });
});

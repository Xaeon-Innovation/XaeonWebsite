import bcrypt from "bcryptjs";
import request from "supertest";
import app from "../src/app";
import User from "../src/models/user.model";
import Employee from "../src/models/employee.model";

export { app };

export async function adminAgent() {
  const email = `admin-${Math.random().toString(36).slice(2, 8)}@test.local`;
  await User.create({
    email,
    password: await bcrypt.hash("AdminPass123!", 4),
    first_name: "Test",
    last_name: "Admin",
    name: "Test Admin",
    phone_number: "0",
    role: "admin",
  });
  const agent = request.agent(app);
  const res = await agent.post("/api/v1/auth/login").send({ email, password: "AdminPass123!" });
  if (res.status !== 200) throw new Error(`admin login failed: ${res.status}`);
  return agent;
}

export async function employee(name = "Sara Sales") {
  const [first, last] = name.split(" ");
  return Employee.create({
    email: `${first.toLowerCase()}-${Math.random().toString(36).slice(2, 6)}@test.local`,
    password: "x",
    first_name: first,
    last_name: last ?? "-",
    name,
    phone_number: "0100",
    role: "Sales",
  });
}

export function enquiry(overrides: Record<string, unknown> = {}) {
  return {
    serviceRequest: {
      source: "contact",
      name: "Mona Adel",
      phone: "+201000000001",
      email: "mona@example.com",
      message: "We need a new website for our clinics.",
      ...overrides,
    },
  };
}

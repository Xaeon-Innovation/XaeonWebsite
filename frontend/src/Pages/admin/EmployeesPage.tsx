import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useResourceApi } from "../../lib/useAdminApi";
import DataTable, { type Column } from "../../Components/admin/DataTable";
import FormModal from "../../Components/admin/FormModal";

const ROLES = [
  "Backend Developer",
  "Frontend Developer",
  "Full-Stack Developer",
  "Graphic Designer",
  "Project Manager",
  "Sales",
  "Admin",
] as const;

type Employee = {
  _id: string;
  email: string;
  first_name: string;
  last_name: string;
  name: string;
  department: string;
  phone_number: string;
  role: string;
  createdAt: string;
};

const schema = z.object({
  first_name: z.string().trim().min(2, "Required"),
  last_name: z.string().trim().min(2, "Required"),
  email: z.string().trim().email("Invalid email"),
  phone_number: z.string().trim().min(7, "Required"),
  department: z.string().trim().optional(),
  role: z.enum(ROLES),
});

type FormValues = z.infer<typeof schema>;

export function Component() {
  const { data, loading, error, create, update, remove } = useResourceApi<Employee>("/employee", "employees", "employee");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);

  const form = useForm<FormValues>({ resolver: zodResolver(schema), mode: "onBlur" });

  const openCreate = () => {
    setEditing(null);
    form.reset({ first_name: "", last_name: "", email: "", phone_number: "", department: "", role: "Frontend Developer" });
    setModalOpen(true);
  };

  const openEdit = (emp: Employee) => {
    setEditing(emp);
    form.reset({
      first_name: emp.first_name,
      last_name: emp.last_name,
      email: emp.email,
      phone_number: emp.phone_number,
      department: emp.department ?? "",
      role: emp.role as FormValues["role"],
    });
    setModalOpen(true);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (editing) {
        await update({ id: editing._id, ...values });
      } else {
        await create(values);
      }
      setModalOpen(false);
    } catch { /* */ }
  });

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await remove(deleteTarget._id);
    setDeleteTarget(null);
  };

  const columns: Column<Employee>[] = [
    { header: "Name", accessor: "name", sortable: true },
    { header: "Email", accessor: "email", sortable: true },
    { header: "Department", accessor: "department", sortable: true },
    {
      header: "Role",
      accessor: "role",
      sortable: true,
      render: (v) => <span className="admin-badge admin-badge-blue">{String(v)}</span>,
    },
    { header: "Phone", accessor: "phone_number" },
    {
      header: "",
      accessor: () => null,
      render: (_, row) => (
        <div style={{ display: "flex", gap: 6 }}>
          <button type="button" className="admin-btn admin-btn-ghost" style={{ padding: "4px 8px" }} onClick={(e) => { e.stopPropagation(); openEdit(row); }}>
            <Pencil size={14} />
          </button>
          <button type="button" className="admin-btn admin-btn-danger" style={{ padding: "4px 8px" }} onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }}>
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Helmet><title>Employees — Xaeon Admin</title></Helmet>

      <div className="admin-page-header">
        <h2 className="admin-page-title">Employees</h2>
        <button type="button" className="admin-btn admin-btn-primary" onClick={openCreate}>
          <Plus size={16} /> Add Employee
        </button>
      </div>

      {error && <p style={{ color: "#ef4444", marginBottom: 12 }}>{error}</p>}
      {loading ? (
        <div style={{ color: "#72c04f", padding: 32, textAlign: "center" }}>Loading…</div>
      ) : (
        <DataTable columns={columns} data={data} keyField="_id" searchFields={["name", "email", "department", "role"]} searchPlaceholder="Search employees…" />
      )}

      <FormModal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Employee" : "New Employee"}>
        {modalOpen && (
          <form className="admin-form" onSubmit={onSubmit}>
            <div className="admin-form-row">
              <div className="admin-field">
                <label className="admin-label">First name</label>
                <input className="admin-input" {...form.register("first_name")} />
                {form.formState.errors.first_name && <p className="admin-field-error">{form.formState.errors.first_name.message}</p>}
              </div>
              <div className="admin-field">
                <label className="admin-label">Last name</label>
                <input className="admin-input" {...form.register("last_name")} />
                {form.formState.errors.last_name && <p className="admin-field-error">{form.formState.errors.last_name.message}</p>}
              </div>
            </div>
            <div className="admin-field">
              <label className="admin-label">Email</label>
              <input className="admin-input" type="email" {...form.register("email")} />
              {form.formState.errors.email && <p className="admin-field-error">{form.formState.errors.email.message}</p>}
            </div>
            <div className="admin-form-row">
              <div className="admin-field">
                <label className="admin-label">Phone number</label>
                <input className="admin-input" {...form.register("phone_number")} />
                {form.formState.errors.phone_number && <p className="admin-field-error">{form.formState.errors.phone_number.message}</p>}
              </div>
              <div className="admin-field">
                <label className="admin-label">Role</label>
                <select className="admin-select" {...form.register("role")}>
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="admin-field">
              <label className="admin-label">Department</label>
              <input className="admin-input" {...form.register("department")} />
            </div>
            <div className="admin-form-actions">
              <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
              <button type="submit" className="admin-btn admin-btn-primary" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving…" : editing ? "Save" : "Create"}
              </button>
            </div>
          </form>
        )}
      </FormModal>

      <FormModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Employee">
        <p className="admin-confirm-text">Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?</p>
        <div className="admin-form-actions">
          <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setDeleteTarget(null)}>Cancel</button>
          <button type="button" className="admin-btn admin-btn-danger" onClick={confirmDelete}>Delete</button>
        </div>
      </FormModal>
    </>
  );
}

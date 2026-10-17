export const AdminRoutes = {
  home: "/admin",
  login: "/admin/login",
  institutions: "/admin/institutions",
  institution: (id: string) => `/admin/institutions/${encodeURIComponent(id)}`,
  student: (id: string) => `/admin/students/${encodeURIComponent(id)}`,
};

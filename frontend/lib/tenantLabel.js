export function tenantName(tenant) {
  if (tenant?.user?.name) return tenant.user.name;
  const code = tenant?.code ? ` (${tenant.code})` : '';
  const base = tenant?.name || (tenant?.id ? `Tenant #${tenant.id}` : 'Tenant');
  return `${base}${code}`;
}

export function tenantFull(tenant) {
  const name = tenantName(tenant);
  if (tenant?.user?.email) return `${name} (${tenant.user.email})`;
  return name;
}
/**
 * T080 — auth feature barrel.
 */

export { LoginForm } from "./ui/LoginForm";
export { RegisterForm } from "./ui/RegisterForm";
export { AuthBoundary } from "./ui/AuthBoundary";
export { useLoginMutation } from "./hooks/useLoginMutation";
export { useRegisterMutation } from "./hooks/useRegisterMutation";
export { useLogoutMutation } from "./hooks/useLogoutMutation";
export { canEdit } from "./policy/canEdit";
export { canView } from "./policy/canView";
export type { LoginInput, RegisterInput, User } from "./types";

export interface PasswordRule {
    id: string;
    text: string;
    validate: (password: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
    { id: 'length', text: 'Tối thiểu 8 ký tự', validate: (p) => p.length >= 8 },
    { id: 'uppercase', text: 'Ít nhất 1 chữ hoa', validate: (p) => /[A-Z]/.test(p) },
    { id: 'lowercase', text: 'Ít nhất 1 chữ thường', validate: (p) => /[a-z]/.test(p) },
    { id: 'number', text: 'Ít nhất 1 số', validate: (p) => /[0-9]/.test(p) },
    { id: 'special', text: 'Ít nhất 1 ký tự đặc biệt', validate: (p) => /[^A-Za-z0-9]/.test(p) },
];

export function allPasswordRulesPass(password: string): boolean {
    return PASSWORD_RULES.every((r) => r.validate(password));
}

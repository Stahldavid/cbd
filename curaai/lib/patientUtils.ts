/**
 * Calculate age from date of birth
 * @param dobString Date of birth string (YYYY-MM-DD)
 * @returns Age as a string with format "X anos"
 */
export function calculateAge(dobString: string): string {
  if (!dobString) return '';
  
  const birthDate = new Date(dobString);
  const today = new Date();
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age > 0 ? `${age} anos` : '';
}

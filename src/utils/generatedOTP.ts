export const generatedOTP = (): string => {
  const generate = `${Math.floor(1000 + Math.random() * 9000)}`;
  return generate;
};

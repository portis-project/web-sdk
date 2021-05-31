export const isClientSide = () => !!(typeof window !== 'undefined' && window.document);

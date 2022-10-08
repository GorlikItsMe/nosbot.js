export const sleep = async (milliseconds: number): Promise<void> => {
    await new Promise((resolve) => {
        return setTimeout(resolve, milliseconds);
    });
};

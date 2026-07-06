let io = null;

export const setSocket = (socket) => {
  io = socket;
};

export const getSocket = () => io;

export type Session = {
  itemId: string;
  listKey: string;
  data: {
    name: string;
    role?: {
      id: string;
      name: string;
      canManageOwnPosts: boolean;
      canManagePosts: boolean;
      canManageOwnProducts: boolean;
      canManageProducts: boolean;
      canManageOrders: boolean;
      canManageRoles: boolean;
      canManageUsers: boolean;
      canCreateTodos: boolean;
      canManageAllTodos: boolean;
      canSeeOtherPeople: boolean;
      canEditOtherPeople: boolean;
      canManagePeople: boolean;
    };
  };
};

export type ListAccessArgs = {
  itemId?: string;
  session?: Session;
};

export const isSignedIn = ({ session }: ListAccessArgs) => {
  return !!session;
};

export const permissions = {
  canManageOwnPosts: ({ session }: ListAccessArgs) =>
    !!session?.data.role?.canManageOwnPosts,
  canManagePosts: ({ session }: ListAccessArgs) =>
    !!session?.data.role?.canManagePosts,
  canManageOwnProducts: ({ session }: ListAccessArgs) =>
    !!session?.data.role?.canManageOwnProducts,
  canManageProducts: ({ session }: ListAccessArgs) =>
    !!session?.data.role?.canManageProducts,
  canManageOrders: ({ session }: ListAccessArgs) =>
    !!session?.data.role?.canManageOrders,
  canManageRoles: ({ session }: ListAccessArgs) =>
    !!session?.data.role?.canManageRoles,
  canManageUsers: ({ session }: ListAccessArgs) =>
    !!session?.data.role?.canManageUsers,
};

export const rules = {
  canManageUsers: ({ session }: ListAccessArgs) => {
    if (!session) {
      return false;
    } else if (session.data.role?.canManageUsers) {
      return true;
    } else {
      return { id: { equals: session.itemId } };
    }
  },
  canManageOrders: ({ session }: ListAccessArgs) => {
    if (!session) {
      return false;
    } else if (session.data.role?.canManageOrders) {
      return true;
    } else {
      return {
        customer: {
          id: {
            equals: session.itemId,
          },
        },
      };
    }
  },
};

// import { type SocketAPIUser } from '../../../common';
// import { socketAPIUserAuthenticated, socketAPIUserSignOut } from '../../../common/internalEvents';
// import { useEvent } from '../../events';
// import { getServerConfig } from '../../internalModels';
// import { jwt } from '../../jwt';
// import { useClient } from '../socket';

// interface SocketAPIAuthenticationData<UserType extends SocketAPIUser> {
//   user?: UserType;
//   token?: string;
//   privateKey?: string;
//   publicKey?: string;
// }

// export function useSocketAPIAuthentication<UserType extends SocketAPIUser>() {
//   const { client, getData } = useClient();
//   const userAuthenticated = useEvent(socketAPIUserAuthenticated);
//   const userSignOut = useEvent(socketAPIUserSignOut);

//   const setUser = async (user: UserType | undefined) => {
//     const authenticationData = getData<SocketAPIAuthenticationData<UserType>>('socket-api-authentication', () => ({}));
//     if (user == null) {
//       if (authenticationData.token != null) return;
//       authenticationData.token = undefined;
//       authenticationData.privateKey = undefined;
//       authenticationData.publicKey = undefined;
//       userSignOut();
//     } else {
//       const { onSavePrivateKey, privateKey: providedPrivateKey } = getServerConfig();
//       const { token, privateKey, publicKey } = jwt.createTokenFromUser(user, providedPrivateKey);
//       authenticationData.token = token;
//       authenticationData.privateKey = privateKey;
//       authenticationData.publicKey = publicKey;
//       await onSavePrivateKey?.(client, user, privateKey);
//       userAuthenticated({ token, publicKey });
//     }

//   };

//   const getUser = () => getData<SocketAPIAuthenticationData<UserType>>('socket-api-user', () => ({})).user;

//   return {
//     getUser,
//     setUser,
//   };
// }

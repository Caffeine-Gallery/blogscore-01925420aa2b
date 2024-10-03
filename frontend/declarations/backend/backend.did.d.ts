import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Post {
  'id' : PostId,
  'title' : string,
  'content' : string,
  'authorId' : UserId,
  'createdAt' : Time,
}
export type PostId = bigint;
export interface Rating { 'value' : bigint, 'userId' : UserId }
export type Time = bigint;
export interface User { 'id' : UserId, 'bio' : string, 'username' : string }
export type UserId = Principal;
export interface _SERVICE {
  'createPost' : ActorMethod<[string, string], PostId>,
  'createProfile' : ActorMethod<[string, string], undefined>,
  'getAggregatedRating' : ActorMethod<[PostId], [] | [number]>,
  'getAllPosts' : ActorMethod<[], Array<Post>>,
  'getPost' : ActorMethod<[PostId], [] | [Post]>,
  'getPostRatings' : ActorMethod<[PostId], [] | [Array<Rating>]>,
  'getProfile' : ActorMethod<[UserId], [] | [User]>,
  'getUserPosts' : ActorMethod<[UserId], Array<Post>>,
  'ratePost' : ActorMethod<[PostId, bigint], undefined>,
  'updateBio' : ActorMethod<[string], undefined>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];

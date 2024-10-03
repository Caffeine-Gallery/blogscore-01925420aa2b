export const idlFactory = ({ IDL }) => {
  const PostId = IDL.Nat;
  const UserId = IDL.Principal;
  const Time = IDL.Int;
  const Post = IDL.Record({
    'id' : PostId,
    'title' : IDL.Text,
    'content' : IDL.Text,
    'authorId' : UserId,
    'createdAt' : Time,
  });
  const Rating = IDL.Record({ 'value' : IDL.Nat, 'userId' : UserId });
  const User = IDL.Record({
    'id' : UserId,
    'bio' : IDL.Text,
    'username' : IDL.Text,
  });
  return IDL.Service({
    'createPost' : IDL.Func([IDL.Text, IDL.Text], [PostId], []),
    'createProfile' : IDL.Func([IDL.Text, IDL.Text], [], []),
    'getAggregatedRating' : IDL.Func(
        [PostId],
        [IDL.Opt(IDL.Float64)],
        ['query'],
      ),
    'getPost' : IDL.Func([PostId], [IDL.Opt(Post)], ['query']),
    'getPostRatings' : IDL.Func(
        [PostId],
        [IDL.Opt(IDL.Vec(Rating))],
        ['query'],
      ),
    'getProfile' : IDL.Func([UserId], [IDL.Opt(User)], ['query']),
    'getUserPosts' : IDL.Func([UserId], [IDL.Vec(Post)], ['query']),
    'ratePost' : IDL.Func([PostId, IDL.Nat], [], []),
    'updateBio' : IDL.Func([IDL.Text], [], []),
  });
};
export const init = ({ IDL }) => { return []; };

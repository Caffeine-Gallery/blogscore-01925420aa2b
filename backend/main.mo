import Float "mo:base/Float";
import Hash "mo:base/Hash";
import Int "mo:base/Int";

import Array "mo:base/Array";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Option "mo:base/Option";
import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Time "mo:base/Time";

actor {
  // Types
  type UserId = Principal;
  type PostId = Nat;

  type User = {
    id: UserId;
    username: Text;
    bio: Text;
  };

  type Post = {
    id: PostId;
    authorId: UserId;
    title: Text;
    content: Text;
    createdAt: Time.Time;
  };

  type Rating = {
    userId: UserId;
    value: Nat;
  };

  // State
  stable var nextPostId : PostId = 0;
  let users = HashMap.HashMap<UserId, User>(10, Principal.equal, Principal.hash);
  let posts = HashMap.HashMap<PostId, Post>(10, Nat.equal, Nat.hash);
  let ratings = HashMap.HashMap<PostId, [Rating]>(10, Nat.equal, Nat.hash);

  // User Management
  public shared(msg) func createProfile(username: Text, bio: Text) : async () {
    let userId = msg.caller;
    let user : User = {
      id = userId;
      username = username;
      bio = bio;
    };
    users.put(userId, user);
  };

  public shared(msg) func updateBio(newBio: Text) : async () {
    let userId = msg.caller;
    switch (users.get(userId)) {
      case (null) {
        // User not found
      };
      case (?user) {
        let updatedUser : User = {
          id = user.id;
          username = user.username;
          bio = newBio;
        };
        users.put(userId, updatedUser);
      };
    };
  };

  public query func getProfile(userId: UserId) : async ?User {
    users.get(userId)
  };

  // Blog Post Management
  public shared(msg) func createPost(title: Text, content: Text) : async PostId {
    let post : Post = {
      id = nextPostId;
      authorId = msg.caller;
      title = title;
      content = content;
      createdAt = Time.now();
    };
    posts.put(nextPostId, post);
    nextPostId += 1;
    nextPostId - 1
  };

  public query func getPost(postId: PostId) : async ?Post {
    posts.get(postId)
  };

  public query func getUserPosts(userId: UserId) : async [Post] {
    let userPosts = Array.filter<Post>(Iter.toArray(posts.vals()), func (post) { post.authorId == userId });
    userPosts
  };

  // Rating System
  public shared(msg) func ratePost(postId: PostId, value: Nat) : async () {
    let userId = msg.caller;
    let rating : Rating = {
      userId = userId;
      value = value;
    };
    switch (ratings.get(postId)) {
      case (null) {
        ratings.put(postId, [rating]);
      };
      case (?existingRatings) {
        let updatedRatings = Array.filter<Rating>(existingRatings, func (r) { r.userId != userId });
        ratings.put(postId, Array.append<Rating>(updatedRatings, [rating]));
      };
    };
  };

  public query func getPostRatings(postId: PostId) : async ?[Rating] {
    ratings.get(postId)
  };

  public query func getAggregatedRating(postId: PostId) : async ?Float {
    switch (ratings.get(postId)) {
      case (null) { null };
      case (?postRatings) {
        let sum = Array.foldLeft<Rating, Nat>(postRatings, 0, func (acc, rating) { acc + rating.value });
        let count = postRatings.size();
        if (count == 0) { null } else { ?(Float.fromInt(sum) / Float.fromInt(count)) };
      };
    };
  };
}

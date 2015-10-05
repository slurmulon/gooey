# :cloud: Gooey

> PubSub data synchronization solution for ES6 Single Page Applications

## Problem

Single Page Applications (SPAs) enable incredibly responsive user experiences on the web by loading an application once and then dynamically updating
the state of the client application via JavaScript and asynchronous HTTP requests.

SPAs are innovative and play an integral role in slick modern web experiences, but the engineers of these applications are often faced with challenges regarding state.
I've described the issues as I see them in both abstract and concrete terms.

### Abstract

SPAs have a dynamic context of multi-layered components that continually changes based on user interactions with the system.
The states and interactions between these components and their layers often span domains and typically become more complex as an application grows.

Elegantly synchronizing the data / state between the components and layers of this dynamic context is, in my opinion, one of the greatest challenges
facing SPAs.

Gooey aims to ease the management of complex multi-layer component states by iscolating, refining and consolidating the imperative patterns into a single library.

### Concrete

SPAs typically consume Restful HTTP APIs. HTTP APIs are stateless and SPA clients are stateful, introducing an interesting conflict. 
For example, Restful HTTP APIs encourage granular updates to resource entities but force clients to handle updates to other entities in the client (and sometimes in the API) that are partially or even direclty related to them.
This gap in state and shift in responsibility makes it possible for the client to have one representation of an entity and the API another.

An alternative is to integrate with more monolothic responses from resources that are typically pushing the boundaries of their scope, which of course isn't great because it reminds us of the painful age of page refreshes.
Another approach is to reflect and duplicate the domain model present in the API, but this isn't very maintainable and doesn't address the root of the problem.

Allowing client-side components to interact with each other via publish / subscribe messaging enables them to synchronize their state safely and efficiently.
As an effect, complex client-side components can more easily interact and synchronize with their API resource counterparts.

### Example

Suppose you are designing an online portal for a company that finances renewable energy systems.
You might represent your model components as a composition hierarchy:

                                       User
                                        |
                         +-----------------------------+
                         |                             |
                         v                             v
                       Quotes                       Proposals
                         |
         +------------------------------+
         |                              |
         v                              v
      Systems                   Finance Products


In this architecture, the User component is essentially acting as the canonical context of the application since all other
model components depend on it.

Assume that a User can be viewing either one Quote or Proposal at a time. If a Quote is selected,
then the User must also have one System and one Finance Product selected.

What can make this simple yet dynamic context difficult to manage? (Examples represent potential future requirements):

 - Component states are often decoupled and split across layers of the stack
    * Example: The state of the User and its dependent components must also be synchronized with the the view and the API
 - Strong coupling between components (components expclitly reference and depend on each other)
    * Example: If the address of a User's only Quote is changed, reflect the change in the User's primary address as well
 - Distant interdependencies between components
    * Example: If a System reaches a "finance ready" state, the Quote now needs Documents which the User can sign. User can't interact with other parts of the application until they sign or reject the Documents.
 - Difficult to synchronize effects and limitations of errors between relevant components
    * Example: If a Finance Product component experiences a 500 error, ensure that User can no longer access the Quote and, if possible, re-select a new Quote for the User.

The mechanism of data synchronization and "binding" in modern JS frameworks is often re-invented and sometimes implemented with
inefficient and bug-prone solutions that emphasize digest cycles or queued listeners.

---

Gooey avoids many common pitfalls of data synchronization by combining the following traits, patterns, and philosophies:

* Publish / Subscribe as primary synchronization mechanism
* Hierarchical acyclic relationships between `Services`
* Bi-directional data traversals (synchronous and asynchronous)
* Allow decoupled communication between `Services` via pattern-matched topics
* `Services` are canonical
* `Services` are proxies (data can be safely mutated by a `Service` before being passed on)
* `Promises` everywhere

I will ellaborate more on the benefits of this combination with "proofs" and examples as I find the time :)

## Architecture

Gooey is loosly follows the [Composite Pattern](https://en.wikipedia.org/wiki/Composite_pattern){:target="_blank"} and represents data components as canonical `Services` that
can subscribe and publish data via [topic-based](https://en.wikipedia.org/wiki/Publish%E2%80%93subscribe_pattern#Message_filtering){:target="_blank"} messsages.

`Services` have a 1:1 relationship with an optional parent `Service` and a 1:N relationship with optional child `Services`.

These relationships naturally establish a tree structure that can scale to support any number of `Services`:


                (?) Parent Service
                        |
                        |
                     Service
                        |
         +-----------------------------+
         |                             |
         v                             v
    (?) Child Service A           (?) Child Service B


`Services` that form this tree can publish data to each other bi-direciontally. Gooey supports several
traversal patterns for data publication but performs breadth-first up/down by default.

Because `Services` can communicate with related services bi-direciontally, they can be extended to support the components
of a modern SPA:


                (?) Rest Service
                        |
                        |
                     Service
                        |
         +-----------------------------+
         |                             |
         v                             v
    (?) View Service A         (?) View Service B


However, this design is out of the scope of Gooey core and will be in a module of its own.

## Installation

> $ npm install

> $ gulp install

## Testing

> $ gulp test

## Contributing

Gooey is still in its very early stages. Please feel free to message [me@madhax.io](mailto:me@madhax.io) if you are interested in contributing!

## TODO

- [X] Depth-first Down Traversal
- [ ] Depth-first Up Traversal (in prog.)
- [X] Breadth-first Down Traversal
- [ ] Breadth-first Up Traversal
- [ ] Concurrent traversals
- [ ] Sibling collisions (Up direction)
- [ ] Composite/Nestable Services

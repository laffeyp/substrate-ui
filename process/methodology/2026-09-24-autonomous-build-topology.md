# Autonomous build topology

The autonomous build topology is the session topology with a few modifications.

1. The input is fixed. It consists of a roadmap, a series of sprint cards, and a prompt.

The prompt has two parts. One part is fixed. It describes general best practices. The other part is specific to the project.

2. Every time the session topology would return to the user, instead there is an automatic response that anticipates generally all common model replies, which usually have nothing to do with the actual content but take a specific form. So generally it will say things like if there is a question, the answer is best practices. It will simply redirect to very basic things. Every time the session topology would return and wait for a user prompt, this prompt will be injected instead.

3. The only follow-up to this will be that eventually, every n turns will trigger a review instead of simply continuing. There will be a standing reviewer topology. That standing reviewer topology will be opened up and instantiated at the same time as the autonomous build topology. In essence, it is a real part of the autonomous build topology. Every n times the topology needs user input, instead of responding with the auto-reply, it will NOT respond to the model at all. It will let it park and then feed a prompt to the standing reviewer to produce a review on the most recent work since the last review. It would just be a fixed prompt. Once the reviewer is complete, it returns the review not directly to the other model but to the system topology. That system topology takes that review text and appends these three words to it after a couple of dashes: analyze, verify, apply.

4. The autonomous build topology will normally be instantiated from a user driving the normal session topology. The user will tell the agent running the session topology to start the autonomous build topology, generally after working with that same agent to generate the roadmap and the sprint cards via SDD. Once ready, the part of the prompt to the autonomous build topology that is a variable will be constructed. It just gives it context about the project. And then the autonomous build topology will be kicked off.

5. The point of the review process is to correct the drift. It will not be a normal review process. It will be a drift correction process against the roadmap, against the original intention and sprints, against SDD, and against software engineering best practices as well as the existing conventions of the project, if not starting from scratch.

6. The reviewer can be specifically told that it can suggest changes to the project and new sprint cards, or changes in direction, or even generate a new roadmap and new sprint cards if necessary. This will be an option we will experiment with. It won't necessarily be the default, but it is an incredibly important thing to add, and will solve a lot of problems with drift once you get towards the final sprints.

7. In terms of the ending condition, the ending condition is the last sprint card being completed or the agent being unable to make progress in a specific measured way. Then the autonomous build topology will return to the session topology that invoked it. It should not be assumed that the autonomous build topology is actually building entire full projects, by the way. It could get a roadmap for an epic, and only those sprint cards that live in that epic. Then these session topologies will be long-lived, and the user will interact with it. The session topology may spin up shorter-lived autonomous build topologies for the actual work of building the software. Or not, depending on what the user wants to do. But "one shot" autonomous build topologies should not be assumed at first.

8. Of course, this should not be built fundamentally as if it needs to be invoked by a session topology. It should be able to be invoked as its own topology at any time in any context.

9. Anything not specifically mentioned here should be assumed to function the exact same as the session topology, where that makes sense.

10. The build process for this will be to completely copy the session topology and then modify it.

# (WIP) how to make a robot arm reach a target
// TODO: swap this out with an image/video
<div id="visualizer-container-1" class="visualizer-container"></div>

we have a robot arm grounded in 3D space, and we want its hand (the end effector) to reach a target. if each joint can
rotate freely on its X, Y, and Z axes, how do we calculate that motion?

## How to represent motion?
to calculate how a robot arm moves, we first need a mathematical way to represent a single static object in 3D space.
_(note that we assume 3D space in cartesian coordinates unless explicitly mentioned.)_

Imagine a static box. to capture its exact placement (at any given moment), which is called `Pose`, we need two pieces
of data:
- position: the coordinates of the box
- orientation: the angles the box is facing

_(note: `Pose` is often used interchangeably with `Transform`, but a `Transform` often includes scale, whereas `Pose`
does not.)_

to expand this static pose into a motion, moving the box from one point to another, we can give a set of instructions:
- translation: how far does it move along the x, y, and z axes?
- rotation: how much does it spin around the x, y, and z axes?
- scale: how much does it expand along the x, y, and z axes? (we don't need this for the robot arm example.)

## the transform matrix
### rotating a box
rotating a box can be written in the following form:

$$P_{rotated} = R \cdot P_{initial}$$
in 3D space, the rotation matrix $R$ is a 3x3 matrix. the nice thing about matrix multiplication is that we can
combine multiple matrices together:

$$P_{final} = R_{4} \cdot R_{3} \cdot R_{2} \cdot R_{1} \cdot P_{initial}$$

however, this starts to break down with translation.

### translating a box
say we want to slide the box to a final position. the way we do it is by adding a translation vector $T$:
$$P_{final} = R \cdot P_{initial} + T$$
we now have addition. this breaks the nice property of matrix multiplication, where we could combine multiple
transforms into a single one.
for a single transform, this is fine. but when we have a complicated chain of transforms, it gets really messy...
$$P_{final} = R_1 \cdot (R_2 \cdot (R_3 \cdot (R_4 \cdot (R_5 \cdot P_{local} + T_5) + T_4) + T_3) + T_2) + T_1$$

### the origin is stuck
the reason why we can't represent translation in a 3x3 matrix is because it's not a linear transform. one of the main
properties of a linear transform is that the origin cannot change. but translation, by definition, moves the origin.

another way to prove why a 3x3 matrix multiplication can't represent translation is to look at the following
multiplication. multiplying any 3x3 matrix with an origin (zero vector) always gives you $(0, 0, 0)$:
$$
\begin{bmatrix} a & b & c \\ d & e & f \\ g & h & i \end{bmatrix} \begin{bmatrix} 0 \\ 0 \\ 0 \end{bmatrix} =
\begin{bmatrix} 0 \\ 0 \\ 0 \end{bmatrix}
$$

### the 4th dimension (homogeneous coordinates)
to unstick the origin, we can use a trick where we upgrade to a higher dimension (4D) and treat our 3D space as a
slice hovering at $W = 1$. a shear in the higher dimension then becomes a translation in our 3D slice.

since it's hard to visualize a 3D slice in a 4D space, let's drop it down to 2D and 3D spaces instead. imagine we have
a piece of paper (2D space), and we want to translate a point $P$ in 2D. here, we augment the space into 3D, treating
our flat 2D space as a slice at $Z = 1$. think of a card deck, where our 2D world is the top card. if we push the side
of the deck to shear it (sliding the card deck in one direction), the point $P$ translates across the 2D space.

// TODO: add a visualization here
coming back to 3D/4D, we can now write a 4x4 matrix that packs translation alongside rotation (actually scale as well):
$$
\begin{bmatrix} R_{xx} & R_{xy} & R_{xz} & T_x \\ R_{yx} & R_{yy} & R_{yz} & T_y \\ R_{zx} & R_{zy} & R_{zz} & T_z \\ 0 & 0 & 0 & 1 \end{bmatrix}
\begin{bmatrix} x \\ y \\ z \\ 1 \end{bmatrix}
$$
- top left 3x3: rotation & scale
- right column: translation (and $W$ is locked to 1.)
- bottom row: make the math work lol. it's keeping $W=1$:
  $$W_{final} = (0 \cdot x) + (0 \cdot y) + (0 \cdot z) + (1 \cdot 1) = 1$$
  _note: later this can be used when we talk about perspective, where we don't pass in $(0, 0, 0, 1)$, we are not going to cover it for now._

with this, we can now combine translation and rotation into a single chain of matrix multiplication! this is pretty
important, as calculating motion gets incredibly complicated once we start introducing object hierarchies...

## coordinate spaces
so far, we have discussed how to represent a transform for a single object in a 3D world. but we were a bit sloppy with
our definition of 3D space. the math above works only if the object's local origin coincides with the world's origin.
let's be more precise about the coordinate spaces here before we dive into the transform hierarchy.

### local/model space
let's bring back our example of a single box. this box has its own local space where $(0, 0, 0)$ is its center.
if the box is a cube with a side length of 1 (i.e. width, height, and depth of 1), the top-left corner would be located
at $(-0.5, 0.5, -0.5)$

// TODO: add an image with left-handed coordinate

_(note: we are using a left-handed coordinate system where the positive X-axis points to the right, the positive Y-axis
points up, and the positive Z-axis points forward)_

and the same thing applies to the rotation. when we rotate an object in local space, it rotates around its own center.

### world space
now let's say we want to place this box in the world space at some location with some rotation and scale. how do we do
this? we only know the box's local space, which doesn't change regardless of where the box is located in the world
space. here, we should think "how do i convert my local coordinates into the worlds coordinate system?"

this is where the model matrix (Model $\rightarrow$ World) comes in, which converts the local coordinates into the world
coordinate system. the way you construct the model matrix is you define the new basis of the box in the world space
(with scale applied), and append a translation at the last column:
$$M = \begin{bmatrix} | & | & | & | \\ X_{axis} & Y_{axis} & Z_{axis} & Position \\ | & | & | & | \\ 0 & 0 & 0 & 1 \end{bmatrix}$$

say we want to place the box in the world space at $(1, 2, 3)$:
$$M = \begin{bmatrix} 1 & 0 & 0 & 1 \\ 0 & 1 & 0 & 2 \\ 0 & 0 & 1 & 3 \\ 0 & 0 & 0 & 1 \end{bmatrix}$$

say we rotate the box by $90^\circ$ around the Y-axis and then translate to $(1, 2, 3)$, then:
(counter-clock wise) and then translate to $(1, 2, 3)$...
- X-axis: the basis is now looking at the old Z-axis $(0, 0, 1)$
- Y-axis: the basis doesn't change as we rotate the cube around its Y-axis. so the column stays at $(0, 1, 0)$
- Z-axis: the basis is now looking at the old negative X-axis $(-1, 0, 0)$

combined, we get:
$$M = \begin{bmatrix} 0 & 0 & -1 & 1 \\ 0 & 1 & 0 & 2 \\ 1 & 0 & 0 & 3 \\ 0 & 0 & 0 & 1 \end{bmatrix}$$

_(note: for scaling, you can just modify the basis vectors with a scalar. we are omitting this as we don't need it for
this particular robot arm simulation.)_

### how do we go back to model space?
the nice thing about matrices is that going between those spaces becomes easy as we can invert the matrix.
- model matrix: model $\rightarrow$ world
- inverse model matrix: world $\rightarrow$ model

_note: we can't always invert matrices. we won't cover that case in this post!_

## the skeleton: parent-child hierarchy
the reason we spent so much time defining coordinate spaces is because motion is relative.

if you look at the robot arm image, you will see it has three segments connected by joints. we will call each of them
from bottom to top: joint A (the base), B (the elbow), and C (the wrist, aka end effector).

and as you can see, when A rotates, B and C rotate with it. when B moves, C's transform is affected as well. this
cascading effect is why we need to understand relative transforms and spaces (local and world spaces).

// TODO: insert animations to illustrate the point.
### example motion: local matrices
we will build a specific transform as an example. let's assume every metal segment of our robot arm is exactly 5 units
long.

#### joint A (the base)
because joint A is rooted to the floor, its "parent" is the world.
- rotation: $90^\circ$ around its Y-axis.
- translation: $(0, 0, 0)$. it sits at the world origin.
- $M_{A}$: rotates $90^\circ$ and stays at the world center.

#### joint B (the elbow)
joint B only cares about joint A (as its transform is affected by joint A). it does not know where it is in the world.
to stay glued to the end of segment A, it just needs a local offset equal to the segment's length (which is 5).
- rotation: $30^\circ$ around its Z-axis.
- translation: $(0, 5, 0)$. it sits exactly 5 units above joint A's center.
- $M_{B}$: rotates $30^\circ$ and translates 5 units up in joint A's space.

#### joint C (the end effector)
similarly, joint C only cares about joint B.
- rotation: $75^\circ$ around its X-axis.
- translation: $(0, 5, 0)$. it sits exactly 5 units above joint B's center.
- $M_{C}$: rotates $75^\circ$ and translates 5 units up in joint B's space.

### calculating the model matrix
here we can ask questions like:
- where is a point $P_c$ on the end effector located in world space?
- where is that same point $P_c$ located in joint A's space?
- where is a point $P_b$ on the elbow located in world space?
- and many other questions...

let's answer the first question! to get the answer, we need to trace the path upwards:
joint C's space $\rightarrow$ joint B's space $\rightarrow$ joint A's space $\rightarrow$ world space.

let's do it step by step. let's first bring the point $P_c$ that's in joint C's local space into joint B's space:
$$P_B = M_C \cdot P_c$$

then into joint A's space...
$$P_A = M_B \cdot M_C \cdot P_c$$

and finally into world space...
$$P_{world} = M_A \cdot M_B \cdot M_C \cdot P_c$$

which means our model matrix for joint C is simply:
$$M_{model\_C} = M_A \cdot M_B \cdot M_C$$

this way, a point in any local space can be projected all the way up the chain to find its true position in the world.

## forward kinematics (FK)
what we just did in the section above is called forward kinematics (FK). in FK, we apply transforms down the chain, from
parent to child.
- inputs: local transforms of joint A, B, and C.
- output: the final world transform of joint C (the end effector)

## inverse kinematics (IK)
inverse kinematics is the opposite of forward kinematics. instead of computing the transform from parent to child, we
set a "target transform" where a joint should end up. for example, in our case, we want joint C to end up at the
position where the target box is located.

IK is more complex than FK because it can have multiple valid solutions or no solutions at all! oftentimes, people set
different heuristics to find the most effective solution: energy efficiency, movement efficiency (minimizing
how much the joints need to move to reach the target), etc.

## IK solver
to recap, our goal is to solve "what transform should we apply to make the robot arm touch the target?"; for this, we
need an IK solver which iteratively guesses and adjusts our transforms until the arm reaches the target.

there are many IK solvers, but here we will briefly introduce three popular iterative IK solvers and dive into their
implementations in separate posts:

### CCD (cyclic coordinate descent)
for each joint, CCD draws:
- a line from the joint to the end effector
- a line from the joint to the target

it then rotates the joint to make these two lines align, and moves up the chain (so now we are at joint A).

#### step 1: joint B
- draws a line from joint B to the end effector and a line from joint B to the target
- rotates joint B to make those two lines aligned

#### step 2: joint A (the base)
- moving up the chain, draws a line from joint A to the end effector and a line from joint A to the target
- again, rotates joint A to make those two lines aligned.

the solver keeps repeating those two steps (in our case joint B, joint A, joint B, joint A...).

### FABRIK (forward and backward reaching inverse kinematics)
this approach cares about one rule: the lengths of the segments between the joints never change. the way this works is
to ping-pong between backward and forward reaches.

#### backward pass (from the target to the base)
- move the end effector (joint C) directly to the target
- pull the next joint (joint B) along a line until it's exactly 5 units away from the new joint C position
- pull the base (joint A) until it's exactly 5 units away from the new joint B position

#### forward pass (from the base to the target)
- push the base (joint A) back to its original position
- push joint B back so that it is exactly 5 units away from the base
- push the end effector back so it maintains a length of 5 units from joint B

and the solver keeps repeating those two passes (until it hits the max iteration or touches the target).

### jacobian solver (differential kinematics)
this approach starts by asking: "if i rotate each joint by a tiny amount, how much will the end effector move in the X,
Y, and Z directions?"

it packs all of these derivatives into a massive grid called a jacobian matrix.

since our goal is to find how each joint should be rotated to have the end effector located at the target (or as close
as possible), we actually need to ask an inverse question: "if i want to move my end effector towards the target, how
much rotation do i need to apply to each of the joints?" - the way we do it is to invert the matrix.

the solver applies the rotation, then recomputes the jacobian matrix, and keeps iterating until it reaches the target
(or hits the max iteration)

#### jacobian matrix
in our simple example, as the base is grounded and only the rotations of the joints matter, we explicitly mentioned
rotation in the section above.

however, jacobian matrix is not limited to rotation, we can pack derivatives for any type of movement, because all it
actually cares about is degrees of freedom. depending on the number of DoF, the jacobian matrix simply grows.

### what's next?
now that we covered the foundation needed to implement IK, let's dive into the code implementations:

- [implementing CCD](#post/ccd-solver)
- [implementing FABRIK](#post/fabrik-solver)
- [implementing the jacobian solver](#post/jacobian-solver)
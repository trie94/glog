# motions

## Goal: Make a robot arm reach a target
![image](/glog/roboarm.jpg)

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
multiplication. multiplying any 3x3 matrix with a origin (zero vector) always gives you $(0, 0, 0)$:
$$
\begin{bmatrix} a & b & c \\ d & e & f \\ g & h & i \end{bmatrix} \begin{bmatrix} 0 \\ 0 \\ 0 \end{bmatrix} =
\begin{bmatrix} 0 \\ 0 \\ 0 \end{bmatrix}
$$

### the 4th dimension (homogeneous coordinates)
to unstick the origin, we can use a trick where we upgrade to a higher dimension (4D) and treat our 3D space as a
slice hovering at $W = 1$. a sheer in the higher dimension then becomes a translation in our 3D slice.

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

## the skeleton: parent-child hierarchy
TBF now that we know how the motion of a single object can be represented in a matrix form...

## forward kinematics (FK)
TBF more intuitive way to represent a motion, where we apply transforms top-down (from parent to child)

## inverse kinematics (IK)
TBF reverse way, compute a matrix to reach a target. compared to fk, ik has many solutions.
explain jacobian here

## IK solver
TBF
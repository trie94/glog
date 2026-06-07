# (WIP) jacobian IK solver

// TODO: explain jacobian briefly

## construct jacobian matrix
- columns: what we can control (joint DoF)
- rows: what we care about (end effector position/orientation)

in our example where a robot arm is grounded, and each joint rotates around X, Y, and Z axes (3DoF per joint), the
columns will be:
- col 1-3: joint A (X, Y, and Z axis)
- col 4-6: joint B (X, Y, and Z axis)
- col 7-9: joint C (x, y, and Z axis)

for the rows, we need the end effector's position, so it'd be those three rows:
- row 1: the end effector's world X position
- row 2: the end effector's world Y position
- row 3: the end effector's world Z position

so we need a 3x9 jacobian matrix to solve for the final world position of the end effector.

| | col 1 ($A_x$) | col 2 ($A_y$) | **col 3 ($A_z$)** | col 4 ($B_x$) | col 5 ($B_y$) | col 6 ($B_z$) | col 7 ($C_x$) | col 8 ($C_y$) | col 9 ($C_z$) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **row 1 (end effector $X$)** | $\frac{\partial X}{\partial A_x}$ | $\frac{\partial X}{\partial A_y}$ | $\frac{\partial X}{\partial A_z}$ | $\frac{\partial X}{\partial B_x}$ | $\frac{\partial X}{\partial B_y}$ | $\frac{\partial X}{\partial B_z}$ | $\frac{\partial X}{\partial C_x}$ | $\frac{\partial X}{\partial C_y}$ | $\frac{\partial X}{\partial C_z}$ |
| **row 2 (end effector $Y$)** | $\frac{\partial Y}{\partial A_x}$ | $\frac{\partial Y}{\partial A_y}$ | **$\frac{\partial Y}{\partial A_z}$** | $\frac{\partial Y}{\partial B_x}$ | $\frac{\partial Y}{\partial B_y}$ | $\frac{\partial Y}{\partial B_z}$ | $\frac{\partial Y}{\partial C_x}$ | $\frac{\partial Y}{\partial C_y}$ | $\frac{\partial Y}{\partial C_z}$ |
| **row 3 (end effector $Z$)** | $\frac{\partial Z}{\partial A_x}$ | $\frac{\partial Z}{\partial A_y}$ | $\frac{\partial Z}{\partial A_z}$ | $\frac{\partial Z}{\partial B_x}$ | $\frac{\partial Z}{\partial B_y}$ | $\frac{\partial Z}{\partial B_z}$ | $\frac{\partial Z}{\partial C_x}$ | $\frac{\partial Z}{\partial C_y}$ | $\frac{\partial Z}{\partial C_z}$ |

the dimension of the jacobian matrix depends on what transform data you want in the end. you may want to get the final
world rotation of the end effector, in which case you'd need to append three more rows (rotation for each axis) to pack
that data.

### how to read jacobian matrix
for each cell, it asks, if we move the joint for the column by a tiny amount, how it will affect the world position of
whichever joint corresponds to that row?

for example, if we look at col 3 and row 2, it would mean: "if i move joint A's rotation by a tiny amount on its Z axis,
how much will it affect the end effector's world Y position?"

## inverse jacobian matrix
(TBF) we can't invert a non-square matrix. explain the trick of using a transpose.

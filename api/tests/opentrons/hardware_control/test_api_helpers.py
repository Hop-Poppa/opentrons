import numpy as np
import pytest
from unittest.mock import patch

from opentrons.util import linal


async def test_validating_calibration(hardware):

    assert hardware.valid_transform == True

    singular_matrix = np.array([
        [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 1, 0], [0, 0, 0, 0]])

    await hardware.update_config(gantry_calibration=singular_matrix)

    hardware.validate_calibration()

    assert hardware.valid_transform == False

    identity_matrix = linal.identity_deck_transform()
    await hardware.update_config(gantry_calibration=identity_matrix)

    hardware.validate_calibration()

    assert hardware.valid_transform == False

    outofrange_matrix = np.array([
        [1, 0, 0, 5], [0, 1, 0, 4], [0, 0, 1, 0], [0, 0, 0, 1]])
    await hardware.update_config(gantry_calibration=outofrange_matrix)
    hardware.validate_calibration()

    assert hardware.valid_transform == False

    inrange_matrix = np.array([
        [1, 0, 0, 1], [0, 1, 0, 2], [0, 0, 1, -25], [0, 0, 0, 1]])
    await hardware.update_config(gantry_calibration=inrange_matrix)
    hardware.validate_calibration()

    assert hardware.valid_transform == True
// @flow
// "Robot Controls" card
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { push } from 'connected-react-router'
import { Card, LabeledToggle, LabeledButton, Icon } from '@opentrons/components'
import { CardContentFull } from '../layout'

import { startDeckCalibration } from '../../http-api-client'
import { getFeatureFlags } from '../../config'

import {
  home,
  fetchLights,
  updateLights,
  getLightsOn,
  ROBOT,
} from '../../robot-controls'
import { restartRobot } from '../../robot-admin'
import { selectors as robotSelectors } from '../../robot'
import { CONNECTABLE } from '../../discovery'

import type { State, Dispatch } from '../../types'
import type { ViewableRobot } from '../../discovery/types'
import { Portal } from '../portal'
import { CheckCalibration } from '../CheckCalibration'
import styles from './styles.css'

type Props = {|
  robot: ViewableRobot,
  calibrateDeckUrl: string,
|}

const TITLE = 'Robot Controls'

const CALIBRATE_DECK_DESCRIPTION =
  "Calibrate the position of the robot's deck. Recommended for all new robots and after moving robots."

const CHECK_ROBOT_CAL_DESCRIPTION = "Check the robot's deck calibration"

const ROBOT_CAL_ERROR = 'Bad robot calibration data detected'
const ROBOT_CAL_ERROR_DESCRIPTION =
  'Do not run any protocols or check calibration as robot is likely to experience a crash.'
const ROBOT_CAL_ERROR_RESOLUTION =
  'Please view this link to learn more on how to re-calibrate robot and resolve bad calibration data.'

export function ControlsCard(props: Props) {
  const dispatch = useDispatch<Dispatch>()
  const { robot, calibrateDeckUrl } = props
  const { name: robotName, status, health } = robot
  const ff = useSelector(getFeatureFlags)
  const lightsOn = useSelector((state: State) => getLightsOn(state, robotName))
  const isRunning = useSelector(robotSelectors.getIsRunning)

  // TODO: next BC 2020-03-31 derive this initial robot cal check state from
  // GET request response to /calibration/check/session
  const [isCheckingRobotCal, setIsCheckingRobotCal] = React.useState(false)

  const notConnectable = status !== CONNECTABLE
  const toggleLights = () => dispatch(updateLights(robotName, !lightsOn))
  const canControl = robot.connected && !isRunning

  const startCalibration = () => {
    dispatch(startDeckCalibration(robot)).then(() =>
      dispatch(push(calibrateDeckUrl))
    )
  }

  React.useEffect(() => {
    dispatch(fetchLights(robotName))
  }, [dispatch, robotName])

  const buttonDisabled = notConnectable || !canControl

  return (
    <Card title={TITLE} disabled={notConnectable}>
      {ff.enableRobotCalCheck && (
        <>
          <LabeledButton
            label="Check deck calibration"
            buttonProps={{
              onClick: () => setIsCheckingRobotCal(true),
              disabled: buttonDisabled,
              children: 'Check',
            }}
          >
            <p>{CHECK_ROBOT_CAL_DESCRIPTION}</p>
          </LabeledButton>

          {health && health.valid_calibration && (
            <div className={styles.cal_check_error_wrapper}>
              <Icon
                name={'alert-circle'}
                className={styles.cal_check_error_icon}
              />
              <div>
                <h4 className={styles.cal_check_error}>{ROBOT_CAL_ERROR}</h4>
                <p className={styles.cal_check_error}>
                  {ROBOT_CAL_ERROR_DESCRIPTION}
                </p>
                <p className={styles.cal_check_error}>
                  {ROBOT_CAL_ERROR_RESOLUTION}
                </p>
              </div>
            </div>
          )}
        </>
      )}
      <LabeledButton
        label="Calibrate deck"
        buttonProps={{
          onClick: startCalibration,
          disabled: buttonDisabled,
          children: 'Calibrate',
        }}
      >
        <p>{CALIBRATE_DECK_DESCRIPTION}</p>
      </LabeledButton>
      <LabeledButton
        label="Home all axes"
        buttonProps={{
          onClick: () => dispatch(home(robotName, ROBOT)),
          disabled: buttonDisabled,
          children: 'Home',
        }}
      >
        <p>Return robot to starting position.</p>
      </LabeledButton>
      <LabeledButton
        label="Restart robot"
        buttonProps={{
          onClick: () => dispatch(restartRobot(robotName)),
          disabled: buttonDisabled,
          children: 'Restart',
        }}
      >
        <p>Restart robot.</p>
      </LabeledButton>
      <LabeledToggle
        label="Lights"
        toggledOn={Boolean(lightsOn)}
        onClick={toggleLights}
      >
        <p>Control lights on deck.</p>
      </LabeledToggle>
      {isCheckingRobotCal && (
        <Portal>
          <CheckCalibration
            robotName={robotName}
            closeCalibrationCheck={() => setIsCheckingRobotCal(false)}
          />
        </Portal>
      )}
    </Card>
  )
}

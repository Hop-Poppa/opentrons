// @flow
import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import cx from 'classnames'
import {
  InputField,
  OutlineButton,
  Icon,
  Tooltip,
  useHoverTooltip,
} from '@opentrons/components'
import { i18n } from '../../../localization'
import { getUnsavedForm } from '../../../step-forms/selectors'
import * as steplistActions from '../../../steplist/actions'
import { PROFILE_CYCLE } from '../../../form-types'
import {
  getProfileFieldErrors,
  maskProfileField,
} from '../../../steplist/fieldLevel'
import { getDynamicFieldFocusHandlerId } from '../utils'
import styles from '../StepEditForm.css'
import type {
  ProfileStepItem,
  ProfileItem,
  ProfileCycleItem,
} from '../../../form-types'
import type { FocusHandlers } from '../types'

export const showProfileFieldErrors = ({
  fieldId,
  focusedField,
  dirtyFields,
}: {|
  fieldId: string,
  focusedField: ?string,
  dirtyFields: Array<string>,
|}): boolean =>
  !(fieldId === focusedField) && dirtyFields && dirtyFields.includes(fieldId)

type ProfileCycleRowProps = {|
  cycleItem: ProfileCycleItem,
  focusHandlers: FocusHandlers,
  stepOffset: number,
|}
export const ProfileCycleRow = (props: ProfileCycleRowProps): React.Node => {
  const { cycleItem, focusHandlers, stepOffset } = props
  const dispatch = useDispatch()

  const addStepToCycle = () => {
    dispatch(steplistActions.addProfileStep({ cycleId: cycleItem.id }))
  }

  const deleteProfileCycle = () =>
    dispatch(steplistActions.deleteProfileCycle({ id: cycleItem.id }))

  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: 'top',
  })

  return (
    <div className={styles.profile_cycle_wrapper}>
      <div className={styles.profile_cycle_group}>
        {cycleItem.steps.length > 0 && (
          <div className={styles.cycle_steps}>
            <div className={styles.cycle_row}>
              {cycleItem.steps.map((stepItem, index) => {
                return (
                  <ProfileStepRow
                    profileStepItem={stepItem}
                    focusHandlers={focusHandlers}
                    key={stepItem.id}
                    stepNumber={stepOffset + index}
                    isCycle
                  />
                )
              })}
            </div>

            <ProfileField
              name="repetitions"
              focusHandlers={focusHandlers}
              profileItem={cycleItem}
              units={i18n.t('application.units.cycles')}
              className={cx(styles.small_field, styles.cycles_field)}
              updateValue={(name, value) =>
                dispatch(
                  steplistActions.editProfileCycle({
                    id: cycleItem.id,
                    fields: { [name]: value },
                  })
                )
              }
            />
          </div>
        )}
        <div className={styles.add_cycle_step}>
          <OutlineButton onClick={addStepToCycle}>+ Step</OutlineButton>
        </div>
      </div>
      <div onClick={deleteProfileCycle} {...targetProps}>
        <Tooltip {...tooltipProps}>
          {i18n.t('tooltip.step_fields.profileCycle.deleteCycle')}
        </Tooltip>
        <Icon name="close" className={styles.delete_step_icon} />
      </div>
    </div>
  )
}

export type ProfileItemRowsProps = {|
  focusHandlers: FocusHandlers,
|}

export const ProfileItemRows = (props: ProfileItemRowsProps): React.Node => {
  const dispatch = useDispatch()
  const addProfileCycle = () => dispatch(steplistActions.addProfileCycle(null))
  const addProfileStep = () => dispatch(steplistActions.addProfileStep(null))

  const unsavedForm = useSelector(getUnsavedForm)
  if (!unsavedForm) {
    console.error('ProfileStepRows expected an unsavedForm')
    return null
  }
  const { orderedProfileItems, profileItemsById } = unsavedForm

  let counter = 0

  const rows = orderedProfileItems.map((itemId, index) => {
    const itemFields: ProfileItem = profileItemsById[itemId]

    if (itemFields.type === PROFILE_CYCLE) {
      const cycleRow = (
        <ProfileCycleRow
          cycleItem={itemFields}
          focusHandlers={props.focusHandlers}
          key={itemId}
          stepOffset={counter + 1}
        />
      )

      counter += itemFields.steps.length

      return cycleRow
    }
    counter++
    return (
      <ProfileStepRow
        profileStepItem={itemFields}
        focusHandlers={props.focusHandlers}
        key={itemId}
        stepNumber={counter}
      />
    )
  })

  return (
    <>
      {rows.length > 0 && (
        <div className={styles.profile_step_labels}>
          <div>Name:</div>
          <div>Temperature:</div>
          <div>Time:</div>
        </div>
      )}
      {rows}
      <div className={styles.profile_button_group}>
        <OutlineButton onClick={addProfileStep}>+ Step</OutlineButton>
        <OutlineButton onClick={addProfileCycle}>+ Cycle</OutlineButton>
      </div>
    </>
  )
}

type ProfileFieldProps = {|
  name: string,
  focusHandlers: FocusHandlers,
  profileItem: ProfileItem,
  units?: React.Node,
  className?: string,
  updateValue: (name: string, value: mixed) => mixed,
|}
const ProfileField = (props: ProfileFieldProps) => {
  const {
    focusHandlers,
    name,
    profileItem,
    units,
    className,
    updateValue,
  } = props
  const value = profileItem[name]
  const fieldId = getDynamicFieldFocusHandlerId({
    id: profileItem.id,
    name,
  })

  const onChange = (e: SyntheticEvent<*>) => {
    const value = e.currentTarget.value
    const maskedValue = maskProfileField(name, value)
    updateValue(name, maskedValue)
  }

  const showErrors = showProfileFieldErrors({
    fieldId,
    focusedField: focusHandlers.focusedField,
    dirtyFields: focusHandlers.dirtyFields,
  })
  const errors = getProfileFieldErrors(name, value)
  const errorToShow = showErrors && errors.length > 0 ? errors.join(', ') : null

  // TODO: tooltips for profile fields
  // const tooltipComponent =
  //   props.tooltipComponent || getTooltipForField(stepType, name, disabled)

  const onBlur = () => {
    focusHandlers.onFieldBlur(fieldId)
  }
  const onFocus = () => {
    focusHandlers.onFieldFocus(fieldId)
  }
  return (
    <div className={styles.step_input_wrapper}>
      <InputField
        className={cx(styles.step_input, className)}
        error={errorToShow}
        units={units}
        {...{ name, onChange, onBlur, onFocus, value }}
      />
    </div>
  )
}

type ProfileStepRowProps = {|
  focusHandlers: FocusHandlers,
  profileStepItem: ProfileStepItem,
  stepNumber: number,
  isCycle?: ?boolean,
|}

const ProfileStepRow = (props: ProfileStepRowProps) => {
  const { focusHandlers, profileStepItem, isCycle } = props
  const dispatch = useDispatch()

  const updateStepFieldValue = (name: string, value: mixed) => {
    dispatch(
      steplistActions.editProfileStep({
        id: profileStepItem.id,
        fields: { [name]: value },
      })
    )
  }

  const deleteProfileStep = () => {
    dispatch(steplistActions.deleteProfileStep({ id: profileStepItem.id }))
  }
  const names = ['title', 'temperature', 'durationMinutes', 'durationSeconds']
  const units = {
    title: null,
    temperature: i18n.t('application.units.degrees'),
    durationMinutes: i18n.t('application.units.minutes'),
    durationSeconds: i18n.t('application.units.seconds'),
  }
  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: 'top',
  })
  const fields = names.map(name => {
    const className = name === 'title' ? styles.title : styles.profile_field
    return (
      <ProfileField
        key={name}
        units={units[name]}
        className={className}
        {...{
          name,
          focusHandlers,
          profileItem: profileStepItem,
          updateValue: updateStepFieldValue,
        }}
      />
    )
  })
  return (
    <div className={cx(styles.profile_step_row, { [styles.cycle]: isCycle })}>
      <div
        className={cx(styles.profile_step_fields, {
          [styles.profile_cycle_fields]: isCycle,
        })}
      >
        <span className={styles.profile_step_number}>{props.stepNumber}. </span>
        {fields}
      </div>
      <div
        onClick={deleteProfileStep}
        className={cx({ [styles.cycle_step_delete]: isCycle })}
        {...targetProps}
      >
        <Tooltip {...tooltipProps}>
          {i18n.t('tooltip.step_fields.profileStepRow.deleteStep')}
        </Tooltip>
        <Icon name="close" className={styles.delete_step_icon} />
      </div>
    </div>
  )
}

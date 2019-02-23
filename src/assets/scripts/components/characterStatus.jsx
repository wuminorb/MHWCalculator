'use strict';
/**
 * Character Status
 *
 * @package     MHW Calculator
 * @author      Scar Wu
 * @copyright   Copyright (c) Scar Wu (http://scar.tw)
 * @link        https://github.com/scarwu/MHWCalculator
 */

// Load Libraries
import React, { Component } from 'react';

// Load Core Libraries
import Event from 'core/event';
import Helper from 'core/helper';

// Load Custom Libraries
import _ from 'libraries/lang';
import SetDataset from 'libraries/dataset/set';
import SkillDataset from 'libraries/dataset/skill';
import CommonDataset from 'libraries/dataset/common';

// Load Components
import FunctionalIcon from 'components/common/functionalIcon';

// Load Constant
import Constant from 'constant';

export default class CharacterStatus extends Component {

    // Default Props
    static defaultProps = {
        equips: Helper.deepCopy(Constant.defaultEquips)
    };

    constructor (props) {
        super(props);

        // Initial State
        this.state = {
            equips: props.equips || Helper.deepCopy(Constant.defaultEquips),
            status: Helper.deepCopy(Constant.defaultStatus),
            extraInfo: Helper.deepCopy(Constant.defaultExtraInfo),
            passiveSkills: {},
            tuning: {
                rawAttack: 5,
                rawCriticalRate: 10,
                rawCriticalMultiple: 0.1,
                elementAttack: 100
            }
        };
    }

    /**
     * Handle Functions
     */
    handlePassiveSkillToggle = (skillId) => {
        let passiveSkills = this.state.passiveSkills;

        passiveSkills[skillId].isActive = !passiveSkills[skillId].isActive;

        this.setState({
            passiveSkills: passiveSkills,
        }, () => {
            this.generateStatus();
        });
    };

    handleTuningChange = () => {
        let tuningRawAttack = parseInt(this.refs.tuningRawAttack.value, 10);
        let tuningRawCriticalRate = parseFloat(this.refs.tuningRawCriticalRate.value, 10);
        let tuningRawCriticalMultiple = parseFloat(this.refs.tuningRawCriticalMultiple.value);
        let tuningElementAttack = parseInt(this.refs.tuningElementAttack.value, 10);

        tuningRawAttack = !isNaN(tuningRawAttack) ? tuningRawAttack : 0;
        tuningRawCriticalRate = !isNaN(tuningRawCriticalRate) ? tuningRawCriticalRate : 0;
        tuningRawCriticalMultiple = !isNaN(tuningRawCriticalMultiple) ? tuningRawCriticalMultiple : 0;
        tuningElementAttack = !isNaN(tuningElementAttack) ? tuningElementAttack : 0;

        this.setState({
            tuning: {
                rawAttack: tuningRawAttack,
                rawCriticalRate: tuningRawCriticalRate,
                rawCriticalMultiple: tuningRawCriticalMultiple,
                elementAttack: tuningElementAttack
            }
        }, () => {
            this.generateExtraInfo();
        });
    };

    /**
     * Generate Functions
     */
    generateStatus = () => {
        let equips = this.state.equips;
        let passiveSkills = this.state.passiveSkills;
        let status = Helper.deepCopy(Constant.defaultStatus);

        let info = {};

        info.weapon = (null !== equips.weapon.id)
            ? CommonDataset.getAppliedWeaponInfo(equips.weapon) : null;

        ['helm', 'chest', 'arm', 'waist', 'leg'].forEach((equipType) => {
            info[equipType] = (null !== equips[equipType].id)
                ? CommonDataset.getAppliedArmorInfo(equips[equipType]) : null;
        });

        info.charm = (null !== equips.charm.id)
            ? CommonDataset.getAppliedCharmInfo(equips.charm) : null;

        if (null !== info.weapon) {
            status.critical.rate = info.weapon.criticalRate;
            status.sharpness = info.weapon.sharpness;
            status.element = info.weapon.element;
            status.elderseal = info.weapon.elderseal;
        }

        // Defense
        ['weapon', 'helm', 'chest', 'arm', 'waist', 'leg'].forEach((equipType) => {
            if (null === info[equipType]) {
                return;
            }

            status.defense += info[equipType].defense;
        });

        // Resistance & Set
        let setMapping = {};

        ['helm', 'chest', 'arm', 'waist', 'leg'].forEach((equipType) => {
            if (null === info[equipType]) {
                return;
            }

            Constant.resistances.forEach((elementType) => {
                status.resistance[elementType] += info[equipType].resistance[elementType];
            });

            if (null !== info[equipType].set) {
                let setId = info[equipType].set.id;

                if (undefined === setMapping[setId]) {
                    setMapping[setId] = 0;
                }

                setMapping[setId]++;
            }
        });

        // Skills
        let allSkills = {};

        ['weapon', 'helm', 'chest', 'arm', 'waist', 'leg', 'charm'].forEach((equipType) => {
            if (null === info[equipType]) {
                return;
            }

            info[equipType].skills.forEach((skill) => {
                if (undefined === allSkills[skill.id]) {
                    allSkills[skill.id] = 0;
                }

                allSkills[skill.id] += skill.level;
            });
        });

        Object.keys(setMapping).forEach((setId) => {
            let setCount = setMapping[setId];
            let setInfo = SetDataset.getInfo(setId);

            setInfo.skills.forEach((skill) => {
                if (skill.require > setCount) {
                    return;
                }

                let skillInfo = SkillDataset.getInfo(skill.id);

                status.sets.push({
                    id: setId,
                    require: skill.require,
                    skill: {
                        id: skillInfo.id,
                        level: 1
                    }
                });

                if (undefined === allSkills[skill.id]) {
                    allSkills[skill.id] = 0;
                }

                allSkills[skill.id] += 1;
            });
        });

        let noneElementAttackMutiple = null;
        let enableElement = null;
        let elementAttack = null;
        let elementStatus = null;
        let attackMultipleList = [];
        let defenseMultipleList = [];

        for (let skillId in allSkills) {
            let skill = SkillDataset.getInfo(skillId);
            let level = allSkills[skillId];

            // Fix Skill Level Overflow
            if (level > skill.list.length) {
                level = skill.list.length;
            }

            status.skills.push({
                id: skill.id,
                level: level,
                description: skill.list[level - 1].description
            });

            if ('passive' === skill.type) {
                if (undefined === passiveSkills[skill.id]) {
                    passiveSkills[skill.id] = {
                        isActive: false
                    };
                }

                if (false === passiveSkills[skill.id].isActive) {
                    continue;
                }
            }

            if (undefined === skill.list[level - 1].reaction) {
                continue;
            }

            for (let reactionType in skill.list[level - 1].reaction) {
                let data = skill.list[level - 1].reaction[reactionType];

                switch (reactionType) {
                case 'health':
                case 'stamina':
                case 'attack':
                case 'defense':
                    status[reactionType] += data.value;

                    break;
                case 'criticalRate':
                    status.critical.rate += data.value;

                    break;
                case 'criticalMultiple':
                    status.critical.multiple.positive = data.value;

                    break;
                case 'sharpness':
                    if (null == status.sharpness) {
                        break;
                    }

                    status.sharpness.value += data.value;

                    break;
                case 'elementAttack':
                    if (null === status.element.attack
                        || status.element.attack.type !== data.type) {

                        break;
                    }

                    elementAttack = data;

                    break;
                case 'elementStatus':
                    if (null === status.element.status
                        || status.element.status.type !== data.type) {

                        break;
                    }

                    elementStatus = data;

                    break;
                case 'resistance':
                    if ('all' === data.type) {
                        Constant.resistances.forEach((elementType) => {
                            status.resistance[elementType] += data.value;
                        });
                    } else {
                        status.resistance[data.type] += data.value;
                    }

                    break;
                case 'noneElementAttackMutiple':
                    noneElementAttackMutiple = data;

                    break;
                case 'enableElement':
                    enableElement = data;

                    break;
                case 'attackMultiple':
                    attackMultipleList.push(data.value);

                    break;
                case 'defenseMultiple':
                    if (null !== status.element
                        && false === status.element.isHidden) {

                        break;
                    }

                    defenseMultipleList.push(data.value);

                    break;
                }
            }
        }

        // Last Status Completion
        if (null !== info.weapon) {
            let weaponAttack = info.weapon.attack;
            let weaponType = info.weapon.type;

            status.attack *= Constant.weaponMultiple[weaponType]; // 武器倍率

            if (null == enableElement && null !== noneElementAttackMutiple) {
                status.attack += weaponAttack * noneElementAttackMutiple.value;
            } else {
                status.attack += weaponAttack;
            }
        } else {
            status.attack = 0;
        }

        // Attack Element
        if (null !== status.element.attack) {
            if (null !== enableElement) {
                status.element.attack.value *= enableElement.multiple;
                status.element.attack.isHidden = false;
            }

            if (null !== elementAttack) {
                status.element.attack.value += elementAttack.value;
                status.element.attack.value *= elementAttack.multiple;

                if (status.element.attack.value > status.element.attack.maxValue) {
                    status.element.attack.value = status.element.attack.maxValue;
                }
            }

            status.element.attack.value = parseInt(Math.round(status.element.attack.value));
        }

        // Status Element
        if (null !== status.element.status) {
            if (null !== enableElement) {
                status.element.status.value *= enableElement.multiple;
                status.element.status.isHidden = false;
            }

            if (null !== elementStatus) {
                status.element.status.value += elementStatus.value;
                status.element.status.value *= elementStatus.multiple;

                if (status.element.status.value > status.element.status.maxValue) {
                    status.element.status.value = status.element.status.maxValue;
                }
            }

            status.element.status.value = parseInt(Math.round(status.element.status.value));
        }

        attackMultipleList.forEach((multiple) => {
            status.attack *= multiple;
        });

        defenseMultipleList.forEach((multiple) => {
            status.defense *= multiple;
        });

        status.attack = parseInt(Math.round(status.attack));
        status.defense = parseInt(Math.round(status.defense));

        this.setState({
            status: status,
            passiveSkills: passiveSkills
        }, () => {
            this.generateExtraInfo();
        });
    };

    generateExtraInfo = () => {
        let equips = this.state.equips;
        let status = Helper.deepCopy(this.state.status);
        let extraInfo = Helper.deepCopy(Constant.defaultExtraInfo);

        let result = this.getBasicExtraInfo(equips, status, {});

        extraInfo.rawAttack = result.rawAttack;
        extraInfo.rawCriticalAttack = result.rawCriticalAttack;
        extraInfo.rawExpectedValue = result.rawExpectedValue;
        extraInfo.elementAttack = result.elementAttack;
        extraInfo.elementExpectedValue = result.elementExpectedValue;
        extraInfo.expectedValue = result.expectedValue;

        let tuning = this.state.tuning;

        // Raw Attack Tuning
        status = Helper.deepCopy(this.state.status);
        result = this.getBasicExtraInfo(equips, status, {
            rawAttack: tuning.rawAttack
        });

        extraInfo.perNRawAttackExpectedValue = result.rawExpectedValue - extraInfo.rawExpectedValue;
        extraInfo.perNRawAttackExpectedValue = Math.round(extraInfo.perNRawAttackExpectedValue * 100) / 100;

        // Critical Rate Tuning
        status = Helper.deepCopy(this.state.status);
        result = this.getBasicExtraInfo(equips, status, {
            rawCriticalRate: tuning.rawCriticalRate
        });

        extraInfo.perNRawCriticalRateExpectedValue = result.rawExpectedValue - extraInfo.rawExpectedValue;
        extraInfo.perNRawCriticalRateExpectedValue = Math.round(extraInfo.perNRawCriticalRateExpectedValue * 100) / 100;

        // Critical Multiple Tuning
        status = Helper.deepCopy(this.state.status);
        result = this.getBasicExtraInfo(equips, status, {
            rawCriticalMultiple: tuning.rawCriticalMultiple
        });

        extraInfo.perNRawCriticalMultipleExpectedValue = result.rawExpectedValue - extraInfo.rawExpectedValue;
        extraInfo.perNRawCriticalMultipleExpectedValue = Math.round(extraInfo.perNRawCriticalMultipleExpectedValue * 100) / 100;

        // Element Attack Tuning
        status = Helper.deepCopy(this.state.status);
        result = this.getBasicExtraInfo(equips, status, {
            elementAttack: tuning.elementAttack
        });

        extraInfo.perNElementAttackExpectedValue = result.elementExpectedValue - extraInfo.elementExpectedValue;
        extraInfo.perNElementAttackExpectedValue = Math.round(extraInfo.perNElementAttackExpectedValue * 100) / 100;

        this.setState({
            extraInfo: extraInfo
        });
    };

    getBasicExtraInfo = (equips, status, tuning) => {
        let rawAttack = 0;
        let rawCriticalAttack = 0;
        let rawExpectedValue = 0;
        let elementAttack = 0;
        let elementExpectedValue = 0;
        let expectedValue = 0;

        if (null !== equips.weapon.id) {
            let weaponInfo = CommonDataset.getAppliedWeaponInfo(equips.weapon);
            let weaponMultiple = Constant.weaponMultiple[weaponInfo.type];
            let sharpnessMultiple = this.getSharpnessMultiple(status.sharpness);

            rawAttack = (status.attack / weaponMultiple);

            if (undefined !== tuning.rawAttack) {
                rawAttack += tuning.rawAttack;
            }

            if (undefined !== tuning.rawCriticalRate) {
                status.critical.rate += tuning.rawCriticalRate;
            }

            if (undefined !== tuning.rawCriticalMultiple) {
                status.critical.multiple.positive += tuning.rawCriticalMultiple;
            }

            let criticalRate = (100 >= status.critical.rate)
                ? Math.abs(status.critical.rate) : 100;
            let criticalMultiple = (0 <= status.critical.rate)
                ? status.critical.multiple.positive
                : status.critical.multiple.nagetive;

            if (null !== status.element.attack
                && !status.element.attack.isHidden) {

                elementAttack = status.element.attack.value;

                if (undefined !== tuning.elementAttack) {
                    elementAttack += tuning.elementAttack;
                }

                elementAttack = elementAttack / 10;
            }

            rawAttack *= sharpnessMultiple.raw;
            rawCriticalAttack = rawAttack * criticalMultiple;
            rawExpectedValue = (rawAttack * (100 - criticalRate) / 100)
                + (rawCriticalAttack * criticalRate / 100);

            elementAttack *= sharpnessMultiple.element;
            elementExpectedValue = elementAttack;

            expectedValue = rawExpectedValue + elementExpectedValue;

            rawAttack = Math.round(rawAttack * 100) / 100;
            rawCriticalAttack = Math.round(rawCriticalAttack * 100) / 100;
            rawExpectedValue = Math.round(rawExpectedValue * 100) / 100;
            elementAttack = Math.round(elementAttack * 100) / 100;
            elementExpectedValue = Math.round(elementExpectedValue * 100) / 100;
            expectedValue = Math.round(expectedValue * 100) / 100;
        }

        return {
            rawAttack: rawAttack,
            rawCriticalAttack: rawCriticalAttack,
            rawExpectedValue: rawExpectedValue,
            elementAttack: elementAttack,
            elementExpectedValue: elementExpectedValue,
            expectedValue: expectedValue
        }
    };

    getSharpnessMultiple = (data) => {
        if (null === data) {
            return {
                raw: 1,
                element: 1
            };
        }

        let currentStep = null;
        let currentValue = 0;

        for (let stepName in data.steps) {
            currentStep = stepName;
            currentValue += data.steps[stepName];

            if (currentValue >= data.value) {
                break;
            }
        }

        return {
            raw: Constant.sharpnessMultiple.raw[currentStep],
            element: Constant.sharpnessMultiple.element[currentStep]
        };
    };

    /**
     * Lifecycle Functions
     */
    componentDidMount () {
        this.generateStatus();
    }

    componentWillReceiveProps (nextProps) {
        this.setState({
            equips: nextProps.equips,
            passiveSkills: {}
        }, () => {
            this.generateStatus();
        });
    }

    /**
     * Render Functions
     */
    renderSharpnessBar = (data) => {
        return (
            <div className="mhwc-bar">
                <div className="mhwc-steps">
                    {['red', 'orange', 'yellow', 'green', 'blue', 'white'].map((step) => {
                        return (
                            <div key={'sharpness_' + step} className="mhwc-step" style={{
                                width: (data.steps[step] / 4) + '%'
                            }}></div>
                        );
                    })}
                </div>

                <div className="mhwc-mask" style={{
                    width: ((400 - data.value) / 4) + '%'
                }}></div>
            </div>
        );
    };

    render () {
        let status = this.state.status;
        let extraInfo = this.state.extraInfo;
        let passiveSkills = this.state.passiveSkills;

        if (null === status) {
            return false;
        }

        return (
            <div className="mhwc-list">
                <div key="normal" className="row mhwc-item mhwc-normal">
                    <div className="col-12 mhwc-name">
                        <span>{_('general')}</span>
                    </div>
                    <div className="col-12 mhwc-value">
                        <div className="row">
                            <div className="col-4">
                                <div className="mhwc-name">
                                    <span>{_('health')}</span>
                                </div>
                            </div>
                            <div className="col-2">
                                <div className="mhwc-value">
                                    <span>{status.health}</span>
                                </div>
                            </div>

                            <div className="col-4">
                                <div className="mhwc-name">
                                    <span>{_('stamina')}</span>
                                </div>
                            </div>
                            <div className="col-2">
                                <div className="mhwc-value">
                                    <span>{status.stamina}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div key="attack" className="row mhwc-item mhwc-attack">
                    <div className="col-12 mhwc-name">
                        <span>{_('attackProperty')}</span>
                    </div>
                    <div className="col-12 mhwc-value">
                        <div className="row">
                            {null !== status.sharpness ? [(
                                <div key={'sharpness_1'} className="col-4">
                                    <div className="mhwc-name">
                                        <span>{_('sharpness')}</span>
                                    </div>
                                </div>
                            ), (
                                <div key={'sharpness_2'} className="col-8">
                                    <div className="mhwc-value mhwc-sharpness">
                                        {this.renderSharpnessBar(status.sharpness)}
                                        {this.renderSharpnessBar(status.sharpness)}
                                    </div>
                                </div>
                            )] : false}

                            <div className="col-4">
                                <div className="mhwc-name">
                                    <span>{_('attack')}</span>
                                </div>
                            </div>
                            <div className="col-2">
                                <div className="mhwc-value">
                                    <span>{status.attack}</span>
                                </div>
                            </div>

                            <div className="col-4">
                                <div className="mhwc-name">
                                    <span>{_('criticalRate')}</span>
                                </div>
                            </div>
                            <div className="col-2">
                                <div className="mhwc-value">
                                    <span>{status.critical.rate}%</span>
                                </div>
                            </div>

                            <div className="col-4">
                                <div className="mhwc-name">
                                    <span>{_('criticalMultiple')}</span>
                                </div>
                            </div>
                            <div className="col-2">
                                <div className="mhwc-value">
                                    {(0 <= status.critical.rate) ? (
                                        <span>{status.critical.multiple.positive}x</span>
                                    ) : (
                                        <span>{status.critical.multiple.nagetive}x</span>
                                    )}
                                </div>
                            </div>

                            {null !== status.element.attack ? [(
                                <div key={'attackElement_1'} className="col-4">
                                    <div className="mhwc-name">
                                        <span>{_('element')}: {_(status.element.attack.type)}</span>
                                    </div>
                                </div>
                            ), (
                                <div key={'attackElement_2'} className="col-2">
                                    <div className="mhwc-value">
                                        {status.element.attack.isHidden ? (
                                            <span>({status.element.attack.value})</span>
                                        ) : (
                                            <span>{status.element.attack.value}</span>
                                        )}
                                    </div>
                                </div>
                            )] : false}

                            {null !== status.element.status ? [(
                                <div key={'statusEelement_1'} className="col-4">
                                    <div className="mhwc-name">
                                        <span>{_('element')}: {_(status.element.status.type)}</span>
                                    </div>
                                </div>
                            ), (
                                <div key={'statusEelement_2'} className="col-2">
                                    <div className="mhwc-value">
                                        {status.element.status.isHidden ? (
                                            <span>({status.element.status.value})</span>
                                        ) : (
                                            <span>{status.element.status.value}</span>
                                        )}
                                    </div>
                                </div>
                            )] : false}

                            {null !== status.elderseal ? [(
                                <div key={'elderseal_1'} className="col-4">
                                    <div className="mhwc-name">
                                        <span>{_('elderseal')}</span>
                                    </div>
                                </div>
                            ), (
                                <div key={'elderseal_2'} className="col-2">
                                    <div className="mhwc-value">
                                        <span>{_(status.elderseal.affinity)}</span>
                                    </div>
                                </div>
                            )] : false}
                        </div>
                    </div>
                </div>

                <div key="defense" className="row mhwc-item mhwc-defense">
                    <div className="col-12 mhwc-name">
                        <span>{_('defenseProperty')}</span>
                    </div>
                    <div className="col-12 mhwc-value">
                        <div className="row">
                            <div className="col-4">
                                <div className="mhwc-name">
                                    <span>{_('defense')}</span>
                                </div>
                            </div>
                            <div className="col-2">
                                <div className="mhwc-value">
                                    <span>{status.defense}</span>
                                </div>
                            </div>

                            {Constant.resistances.map((elementType) => {
                                return [(
                                    <div key={elementType + '_1'} className="col-4">
                                        <div className="mhwc-name">
                                            <span>{_('resistance')}: {_(elementType)}</span>
                                        </div>
                                    </div>
                                ),(
                                    <div key={elementType + '_2'} className="col-2">
                                        <div className="mhwc-value">
                                            <span>{status.resistance[elementType]}</span>
                                        </div>
                                    </div>
                                )];
                            })}
                        </div>
                    </div>
                </div>

                {(0 !== status.sets.length) ? (
                    <div key="sets" className="row mhwc-item mhwc-sets">
                        <div className="col-12 mhwc-name">
                            <span>{_('set')}</span>
                        </div>
                        <div className="col-12 mhwc-value">
                            {status.sets.map((data, index) => {
                                let setName = SetDataset.getInfo(data.id).name;
                                let skillName = SkillDataset.getInfo(data.skill.id).name;

                                return (
                                    <div key={`${index}_${data.id}`} className="row mhwc-set">
                                        <div className="col-12 mhwc-name">
                                            <span>{_(setName)} ({data.require})</span>
                                        </div>
                                        <div className="col-12 mhwc-value">
                                            <span>{_(skillName)} Lv.{data.skill.level}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : false}

                {(0 !== status.skills.length) ? (
                    <div key="skills" className="row mhwc-item mhwc-skills">
                        <div className="col-12 mhwc-name">
                            <span>{_('skill')}</span>
                        </div>
                        <div className="col-12 mhwc-value">
                            {status.skills.sort((a, b) => {
                                return b.level - a.level;
                            }).map((data) => {
                                let skillName = SkillDataset.getInfo(data.id).name;

                                return (
                                    <div key={data.id} className="row mhwc-skill">
                                        <div className="col-12 mhwc-name">
                                            <span>{_(skillName)} Lv.{data.level}</span>

                                            <div className="mhwc-icons_bundle">
                                                {undefined !== passiveSkills[data.id] ? (
                                                    <FunctionalIcon
                                                        iconName={passiveSkills[data.id].isActive ? 'eye' : 'eye-slash'}
                                                        altName={passiveSkills[data.id].isActive ? _('deactive') : _('active')}
                                                        onClick={() => {this.handlePassiveSkillToggle(data.id)}} />
                                                ) : false}
                                            </div>
                                        </div>
                                        <div className="col-12 mhwc-value">
                                            <span>{_(data.description)}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : false}

                <div key="extraInfo" className="row mhwc-item mhwc-extra_info">
                    <div className="col-12 mhwc-name">
                        <span>{_('extraInfo')}</span>
                    </div>
                    <div className="col-12 mhwc-value">
                        <div className="row">
                            <div className="col-8 mhwc-name">
                                <span>{_('rawAttack')}</span>
                            </div>
                            <div className="col-4 mhwc-value">
                                <span>{extraInfo.rawAttack}</span>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-8 mhwc-name">
                                <span>{_('rawCriticalAttack')}</span>
                            </div>
                            <div className="col-4 mhwc-value">
                                <span>{extraInfo.rawCriticalAttack}</span>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-8 mhwc-name">
                                <span>{_('rawEV')}</span>
                            </div>
                            <div className="col-4 mhwc-value">
                                <span>{extraInfo.rawExpectedValue}</span>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-8 mhwc-name">
                                <span>{_('elementAttack')}</span>
                            </div>
                            <div className="col-4 mhwc-value">
                                <span>{extraInfo.elementAttack}</span>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-8 mhwc-name">
                                <span>{_('elementEV')}</span>
                            </div>
                            <div className="col-4 mhwc-value">
                                <span>{extraInfo.elementExpectedValue}</span>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-8 mhwc-name">
                                <span>{_('totalEV')}</span>
                            </div>
                            <div className="col-4 mhwc-value">
                                <span>{extraInfo.expectedValue}</span>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-8 mhwc-name">
                                <span>{_('every')}</span>
                                <input className="mhwc-tuning" type="text" defaultValue={this.state.tuning.rawAttack}
                                    ref="tuningRawAttack" onChange={this.handleTuningChange} />
                                <span>{_('rawAttackEV')}</span>
                            </div>
                            <div className="col-4 mhwc-value">
                                <span>{extraInfo.perNRawAttackExpectedValue}</span>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-8 mhwc-name">
                                <span>{_('every')}</span>
                                <input className="mhwc-tuning" type="text" defaultValue={this.state.tuning.rawCriticalRate}
                                    ref="tuningRawCriticalRate" onChange={this.handleTuningChange} />
                                <span>{_('criticalRateEV')}</span>
                            </div>
                            <div className="col-4 mhwc-value">
                                <span>{extraInfo.perNRawCriticalRateExpectedValue}</span>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-8 mhwc-name">
                                <span>{_('every')}</span>
                                <input className="mhwc-tuning" type="text" defaultValue={this.state.tuning.rawCriticalMultiple}
                                    ref="tuningRawCriticalMultiple" onChange={this.handleTuningChange} />
                                <span>{_('criticalMultipleEV')}</span>
                            </div>
                            <div className="col-4 mhwc-value">
                                <span>{extraInfo.perNRawCriticalMultipleExpectedValue}</span>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-8 mhwc-name">
                                <span>{_('every')}</span>
                                <input className="mhwc-tuning" type="text" defaultValue={this.state.tuning.elementAttack}
                                    ref="tuningElementAttack" onChange={this.handleTuningChange} />
                                <span>{_('elementAttackEV')}</span>
                            </div>
                            <div className="col-4 mhwc-value">
                                <span>{extraInfo.perNElementAttackExpectedValue}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

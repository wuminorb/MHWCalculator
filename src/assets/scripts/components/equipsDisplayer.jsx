'use strict';
/**
 * Equips Displayer
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
import WeaponDataset from 'libraries/dataset/weapon';
import ArmorDataset from 'libraries/dataset/armor';
import CharmDataset from 'libraries/dataset/charm';
import JewelDataset from 'libraries/dataset/jewel';
import EnhanceDataset from 'libraries/dataset/enhance';
import SetDataset from 'libraries/dataset/set';
import SkillDataset from 'libraries/dataset/skill';
import CommonDataset from 'libraries/dataset/common';

// Load Components
import FunctionalIcon from 'components/common/functionalIcon';

// Load Constant
import Constant from 'constant';

export default class EquipsDisplayer extends Component {

    // Default Props
    static defaultProps = {
        equips: Helper.deepCopy(Constant.defaultEquips),
        equipsLock: Helper.deepCopy(Constant.defaultEquipsLock),
        onToggleEquipsLock: (equipType) => {},
        onOpenSelector: (data) => {},
        onPickUp: (data) => {}
    };

    constructor (props) {
        super(props);

        // Initial State
        this.state = {
            equips: props.equips || Helper.deepCopy(Constant.defaultEquips),
            equipsLock: props.equipsLock || Helper.deepCopy(Constant.defaultEquipsLock)
        };
    }

    /**
     * Handle Functions
     */
    handleEquipLockToggle = (equipType) => {
        this.props.onToggleEquipsLock(equipType);
    };

    handleEquipSwitch = (data) => {
        this.props.onOpenSelector(data);
    };

    handleEquipEmpty = (data) => {
        this.props.onPickUp(data);
    };

    /**
     * Lifecycle Functions
     */
    static getDerivedStateFromProps(nextProps, prevState) {
        return {
            equips: nextProps.equips,
            equipsLock: nextProps.equipsLock
        };
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
        let equips = this.state.equips;
        let equipsLock = this.state.equipsLock;
        let ContentBlocks = [];

        // Weapon
        let weaponSelectorData = {
            equipType: 'weapon',
            equipId: equips.weapon.id
        };

        let emptyWeaponSelectorData = {
            equipType: 'weapon',
            equipId: null
        };

        if (null === WeaponDataset.getInfo(equips.weapon.id)) {
            equips.weapon.id = null;
        }

        if (null !== equips.weapon.id) {
            let weaponInfo = CommonDataset.getAppliedWeaponInfo(equips.weapon);

            let originalSharpness = null;
            let enhancedSharpness = null;

            if (null !== weaponInfo.sharpness) {
                originalSharpness = Helper.deepCopy(weaponInfo.sharpness);
                enhancedSharpness = Helper.deepCopy(weaponInfo.sharpness);
                enhancedSharpness.value += 50;
            }

            ContentBlocks.push((
                <div key="weapon" className="row mhwc-equip">
                    <div className="col-12 mhwc-name">
                        <a className="mhwc-equip_name" onClick={() => {this.handleEquipSwitch(weaponSelectorData)}}>
                            <span>{_('weapon')}: {_(weaponInfo.name)}</span>
                        </a>

                        <div className="mhwc-icons_bundle">
                            <FunctionalIcon
                                iconName={equipsLock.weapon ? 'lock' : 'unlock-alt'}
                                altName={equipsLock.weapon ? _('unlock') : _('lock')}
                                onClick={() => {this.handleEquipLockToggle('weapon')}} />
                            <FunctionalIcon
                                iconName="times" altName={_('clean')}
                                onClick={() => {this.handleEquipEmpty(emptyWeaponSelectorData)}} />
                        </div>
                    </div>

                    {0 !== weaponInfo.enhances.length ? (
                        <div className="col-12 mhwc-item mhwc-enhances">
                            {weaponInfo.enhances.map((data, index) => {
                                let enhanceSelectorData = {
                                    equipType: 'weapon',
                                    enhanceIndex: index,
                                    enhanceId: data.id
                                };

                                let emptyEnhanceSelectorData = {
                                    equipType: 'weapon',
                                    enhanceIndex: index,
                                    enhanceId: null
                                };

                                return (
                                    <div key={data.id + '_' + index} className="row mhwc-enhance">
                                        <div className="col-4 mhwc-name">
                                            <span>{_('enhance')}: {index + 1}</span>
                                        </div>
                                        <div className="col-8 mhwc-value">
                                            <a onClick={() => {this.handleEquipSwitch(enhanceSelectorData)}}>
                                                {null !== data.id ? (
                                                    <span>{_(EnhanceDataset.getInfo(data.id).name)}</span>
                                                ) : (
                                                    <span>---</span>
                                                )}
                                            </a>

                                            <div className="mhwc-icons_bundle">
                                                {null !== data.id ? (
                                                    <FunctionalIcon
                                                        iconName="times" altName={_('clean')}
                                                        onClick={() => {this.handleEquipEmpty(emptyEnhanceSelectorData)}} />
                                                ) : false}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : false}

                    {(null !== weaponInfo.slots && 0 !== weaponInfo.slots.length) ? (
                        <div className="col-12 mhwc-item mhwc-slots">
                            {weaponInfo.slots.map((data, index) => {
                                let jewelSelectorData = {
                                    equipType: 'weapon',
                                    slotSize: data.size,
                                    slotIndex: index,
                                    slotId: data.jewel.id
                                };

                                let emptyJewelSelectorData = {
                                    equipType: 'weapon',
                                    slotSize: data.size,
                                    slotIndex: index,
                                    slotId: null
                                };

                                return (
                                    <div key={data.id + '_' + index} className="row mhwc-jewel">
                                        <div className="col-4 mhwc-name">
                                            <span>{_('slot')}: {index + 1} [{data.size}]</span>
                                        </div>
                                        <div className="col-8 mhwc-value">
                                            <a onClick={() => {this.handleEquipSwitch(jewelSelectorData)}}>
                                                {null !== data.jewel.id ? (
                                                    <span>[{data.jewel.size}] {_(JewelDataset.getInfo(data.jewel.id).name)}</span>
                                                ) : (
                                                    <span>---</span>
                                                )}
                                            </a>

                                            <div className="mhwc-icons_bundle">
                                                {null !== data.jewel.id ? (
                                                    <FunctionalIcon
                                                        iconName="times" altName={_('clean')}
                                                        onClick={() => {this.handleEquipEmpty(emptyJewelSelectorData)}} />
                                                ) : false}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : false}

                    <div className="col-12 mhwc-item mhwc-properties">
                        <div className="col-12 mhwc-name">
                            <span>{_('property')}</span>
                        </div>
                        <div className="col-12 mhwc-value">
                            <div className="row">
                                {(null !== weaponInfo.sharpness) ? [(
                                    <div key={'sharpness_1'} className="col-4">
                                        <div className="mhwc-name">
                                            <span>{_('sharpness')}</span>
                                        </div>
                                    </div>
                                ), (
                                    <div key={'sharpness_2'} className="col-8">
                                        <div className="mhwc-value mhwc-sharpness">
                                            {this.renderSharpnessBar(originalSharpness)}
                                            {this.renderSharpnessBar(enhancedSharpness)}
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
                                        <span>{weaponInfo.attack}</span>
                                    </div>
                                </div>

                                <div className="col-4">
                                    <div className="mhwc-name">
                                        <span>{_('criticalRate')}</span>
                                    </div>
                                </div>
                                <div className="col-2">
                                    <div className="mhwc-value">
                                        <span>{weaponInfo.criticalRate}%</span>
                                    </div>
                                </div>

                                {(null !== weaponInfo.element.attack) ? [(
                                    <div key={'attackElement_1'} className="col-4">
                                        <div className="mhwc-name">
                                            <span>{_('element')}: {_(weaponInfo.element.attack.type)}</span>
                                        </div>
                                    </div>
                                ), (
                                    <div key={'attackElement_2'} className="col-2">
                                        <div className="mhwc-value">
                                            {weaponInfo.element.attack.isHidden ? (
                                                <span>({weaponInfo.element.attack.value})</span>
                                            ) : (
                                                <span>{weaponInfo.element.attack.value}</span>
                                            )}
                                        </div>
                                    </div>
                                )] : false}

                                {(null !== weaponInfo.element.status) ? [(
                                    <div key={'statusElement_1'} className="col-4">
                                        <div className="mhwc-name">
                                            <span>{_('element')}: {_(weaponInfo.element.status.type)}</span>
                                        </div>
                                    </div>
                                ), (
                                    <div key={'statusElement_2'} className="col-2">
                                        <div className="mhwc-value">
                                            {weaponInfo.element.status.isHidden ? (
                                                <span>({weaponInfo.element.status.value})</span>
                                            ) : (
                                                <span>{weaponInfo.element.status.value}</span>
                                            )}
                                        </div>
                                    </div>
                                )] : false}

                                {(null !== weaponInfo.elderseal) ? [(
                                    <div key={'elderseal_1'} className="col-4">
                                        <div className="mhwc-name">
                                            <span>{_('elderseal')}</span>
                                        </div>
                                    </div>
                                ), (
                                    <div key={'elderseal_2'} className="col-2">
                                        <div className="mhwc-value">
                                            <span>{_(weaponInfo.elderseal.affinity)}</span>
                                        </div>
                                    </div>
                                )] : false}

                                <div className="col-4">
                                    <div className="mhwc-name">
                                        <span>{_('defense')}</span>
                                    </div>
                                </div>
                                <div className="col-2">
                                    <div className="mhwc-value">
                                        <span>{weaponInfo.defense}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {0 !== weaponInfo.skills.length ? (
                        <div className="col-12 mhwc-item mhwc-skills">
                            <div className="col-12 mhwc-name">
                                <span>{_('skill')}</span>
                            </div>
                            <div className="col-12 mhwc-value">
                                <div className="row">
                                    {weaponInfo.skills.sort((a, b) => {
                                        return b.level - a.level;
                                    }).map((data) => {
                                        let skillName = SkillDataset.getInfo(data.id).name;

                                        return (
                                            <div key={data.id} className="col-6">
                                                <div className="mhwc-value">
                                                    <span>{_(skillName)} Lv.{data.level}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ) : false}
                </div>
            ));
        } else {
            ContentBlocks.push((
                <div key="weapon" className="row mhwc-equip">
                    <div className="col-12 mhwc-name">
                        <a onClick={() => {this.handleEquipSwitch(weaponSelectorData)}}>
                            <span>{_('weapon')}: ---</span>
                        </a>
                    </div>
                </div>
            ));
        }

        // Armors
        ['helm', 'chest', 'arm', 'waist', 'leg'].forEach((equipType) => {
            let equipSelectorData = {
                equipType: equipType,
                equipId: equips[equipType].id
            };

            let emptyEquipSelectorData = {
                equipType: equipType,
                equipId: null
            };

            if (null === ArmorDataset.getInfo(equips[equipType].id)) {
                equips[equipType].id = null;
            }

            if (null !== equips[equipType].id) {
                let equipInfo = CommonDataset.getAppliedArmorInfo(equips[equipType]);

                ContentBlocks.push((
                    <div key={'equip_' + equipType} className="row mhwc-equip">
                        <div className="col-12 mhwc-name">
                            <a className="mhwc-equip_name" onClick={() => {this.handleEquipSwitch(equipSelectorData)}}>
                                <span>{_(equipType)}: {_(equipInfo.name)}</span>
                            </a>

                            <div className="mhwc-icons_bundle">
                                <FunctionalIcon
                                    iconName={equipsLock[equipType] ? 'lock' : 'unlock-alt'}
                                    altName={equipsLock[equipType] ? _('unlock') : _('unlock')}
                                    onClick={() => {this.handleEquipLockToggle(equipType)}} />
                                <FunctionalIcon
                                    iconName="times" altName={_('clean')}
                                    onClick={() => {this.handleEquipEmpty(emptyEquipSelectorData)}} />
                            </div>
                        </div>

                        {0 !== equipInfo.slots.length ? (
                            <div className="col-12 mhwc-item mhwc-slots">
                                {equipInfo.slots.map((data, index) => {
                                    let jewelSelectorData = {
                                        equipType: equipType,
                                        slotSize: data.size,
                                        slotIndex: index,
                                        slotId: data.jewel.id
                                    };

                                    let emptyJewelSelectorData = {
                                        equipType: equipType,
                                        slotSize: data.size,
                                        slotIndex: index,
                                        slotId: null
                                    };

                                    return (
                                        <div key={data.id + '_' + index} className="row mhwc-jewel">
                                            <div className="col-4 mhwc-name">
                                                <span>{_('slot')}: {index + 1} [{data.size}]</span>
                                            </div>
                                            <div className="col-8 mhwc-value">
                                                <a onClick={() => {this.handleEquipSwitch(jewelSelectorData)}}>
                                                    {null !== data.jewel.id ? (
                                                        <span>[{data.jewel.size}] {_(JewelDataset.getInfo(data.jewel.id).name)}</span>
                                                    ) : (
                                                        <span>---</span>
                                                    )}
                                                </a>

                                                <div className="mhwc-icons_bundle">
                                                    {null !== data.jewel.id ? (
                                                        <FunctionalIcon
                                                            iconName="times" altName={_('clean')}
                                                            onClick={() => {this.handleEquipEmpty(emptyJewelSelectorData)}} />
                                                    ) : false}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : false}

                        <div className="col-12 mhwc-item mhwc-properties">
                            <div className="col-12 mhwc-name">
                                <span>{_('property')}</span>
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
                                            <span>{equipInfo.defense}</span>
                                        </div>
                                    </div>

                                    {Constant.resistances.map((resistanceType) => {
                                        return [(
                                            <div key={resistanceType + '_1'} className="col-4">
                                                <div className="mhwc-name">
                                                    <span>{_('resistance')}: {_(resistanceType)}</span>
                                                </div>
                                            </div>
                                        ),(
                                            <div key={resistanceType + '_2'} className="col-2">
                                                <div className="mhwc-value">
                                                    <span>{equipInfo.resistance[resistanceType]}</span>
                                                </div>
                                            </div>
                                        )];
                                    })}
                                </div>
                            </div>
                        </div>

                        {null !== equipInfo.set ? (
                            <div className="col-12 mhwc-item mhwc-set">
                                <div className="row">
                                    <div className="col-4 mhwc-name">
                                        <span>{_('set')}</span>
                                    </div>
                                    <div className="col-8 mhwc-value">
                                        <span>{_(SetDataset.getInfo(equipInfo.set.id).name)}</span>
                                    </div>
                                </div>
                            </div>
                        ) : false}

                        {0 !== equipInfo.skills.length ? (
                            <div className="col-12 mhwc-item mhwc-skills">
                                <div className="col-12 mhwc-name">
                                    <span>{_('skill')}</span>
                                </div>
                                <div className="col-12 mhwc-value">
                                    <div className="row">
                                        {equipInfo.skills.sort((a, b) => {
                                            return b.level - a.level;
                                        }).map((data) => {
                                            let skillName = SkillDataset.getInfo(data.id).name;

                                            return (
                                                <div key={data.id} className="col-6">
                                                    <div className="mhwc-value">
                                                        <span>{_(skillName)} Lv.{data.level}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ) : false}
                    </div>
                ) );
            } else {
                ContentBlocks.push((
                    <div key={'equip_' + equipType} className="row mhwc-equip">
                        <div className="col-12 mhwc-name">
                            <a className="mhwc-equip_name" onClick={() => {this.handleEquipSwitch(equipSelectorData)}}>
                                <span>{_(equipType)}: ---</span>
                            </a>
                        </div>
                    </div>
                ));
            }
        });

        // Charm
        let charmSelectorData = {
            equipType: 'charm',
            equipId: equips.charm.id
        };

        let emptyCharmSelectorData = {
            equipType: 'charm',
            equipId: null
        };

        if (null === CharmDataset.getInfo(equips.charm.id)) {
            equips.charm.id = null;
        }

        if (null !== equips.charm.id) {
            let charmInfo = CommonDataset.getAppliedCharmInfo(equips.charm);

            ContentBlocks.push((
                <div key="charm" className="row mhwc-equip">
                    <div className="col-12 mhwc-name">
                        <a onClick={() => {this.handleEquipSwitch(charmSelectorData)}}>
                            <span>{_('charm')}: {_(charmInfo.name)}</span>
                        </a>

                        <div className="mhwc-icons_bundle">
                            <FunctionalIcon
                                iconName={equipsLock.charm ? 'lock' : 'unlock-alt'}
                                altName={equipsLock.charm ? _('unlock') : _('lock')}
                                onClick={() => {this.handleEquipLockToggle('charm')}} />
                            <FunctionalIcon
                                iconName="times" altName={_('clean')}
                                onClick={() => {this.handleEquipEmpty(emptyCharmSelectorData)}} />
                        </div>
                    </div>

                    <div className="col-12 mhwc-item mhwc-skills">
                        <div className="col-12 mhwc-name">
                            <span>{_('skill')}</span>
                        </div>
                        <div className="col-12 mhwc-value">
                            <div className="row">
                                {charmInfo.skills.sort((a, b) => {
                                    return b.level - a.level;
                                }).map((data) => {
                                    let skillName = SkillDataset.getInfo(data.id).name;

                                    return (
                                        <div key={data.id} className="col-6">
                                            <div className="mhwc-value">
                                                <span>{_(skillName)} Lv.{data.level}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            ));
        } else {
            ContentBlocks.push((
                <div key="charm" className="row mhwc-equip">
                    <div className="col-12 mhwc-name">
                        <a onClick={() => {this.handleEquipSwitch(charmSelectorData)}}>
                            <span>{_('charm')}: ---</span>
                        </a>
                    </div>
                </div>
            ));
        }

        return (
            <div className="mhwc-list">
                {ContentBlocks}
            </div>
        );
    }
}

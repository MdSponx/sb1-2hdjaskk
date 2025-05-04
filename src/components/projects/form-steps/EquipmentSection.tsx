import React from 'react';
import { Checkbox } from '../../shared/Checkbox';
import type { Equipment } from '../../../types/member';

interface EquipmentSectionProps {
  equipment: Equipment;
  onEquipmentChange: (field: keyof Equipment, value: boolean) => void;
  onEquipmentSubChange: (field: keyof Equipment, value: boolean) => void;
  onEquipmentDetailsChange: (field: string, value: string) => void;
}

export function EquipmentSection({
  equipment,
  onEquipmentChange,
  onEquipmentSubChange,
  onEquipmentDetailsChange,
}: EquipmentSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Prepared Equipment Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">✅ อุปกรณ์ที่เตรียมมา</h2>
        <div className="space-y-4">
          <div>
            <label className="inline-flex items-center">
              <Checkbox
                checked={equipment.cameraIncluded}
                onCheckedChange={(checked) => {
                  onEquipmentChange('cameraIncluded', checked);
                }}
              />
              <span className="ml-2">📹 เตรียมกล้องมาด้วย</span>
            </label>
            {equipment.cameraIncluded && (
              <div className="mt-2 space-y-2 pl-6">
                <label className="flex items-center">
                  <Checkbox
                    checked={equipment.hasCamera}
                    onCheckedChange={(checked) => onEquipmentSubChange('hasCamera', checked)}
                  />
                  <span className="ml-2">กล้อง</span>
                </label>
                <label className="flex items-center">
                  <Checkbox
                    checked={equipment.hasTripod}
                    onCheckedChange={(checked) => onEquipmentSubChange('hasTripod', checked)}
                  />
                  <span className="ml-2">ขาตั้งกล้อง</span>
                </label>
                <label className="flex items-center">
                  <Checkbox
                    checked={equipment.hasMonitor}
                    onCheckedChange={(checked) => onEquipmentSubChange('hasMonitor', checked)}
                  />
                  <span className="ml-2">จอมอนิเตอร์</span>
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="อุปกรณ์กล้องอื่นๆ"
                    value={equipment.otherCameraEquipment || ''}
                    onChange={(e) => onEquipmentDetailsChange('otherCameraEquipment', e.target.value)}
                    className="form-input w-full"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="inline-flex items-center">
              <Checkbox
                checked={equipment.soundIncluded}
                onCheckedChange={(checked) => {
                  onEquipmentChange('soundIncluded', checked);
                }}
              />
              <span className="ml-2">🎤 เตรียมอุปกรณ์บันทึกเสียงมาด้วย</span>
            </label>
            {equipment.soundIncluded && (
              <div className="mt-2 space-y-2 pl-6">
                <label className="flex items-center">
                  <Checkbox
                    checked={equipment.hasShotgunMic}
                    onCheckedChange={(checked) => onEquipmentSubChange('hasShotgunMic', checked)}
                  />
                  <span className="ml-2">ไมค์ช็อตกัน</span>
                </label>
                <label className="flex items-center">
                  <Checkbox
                    checked={equipment.hasWirelessMic}
                    onCheckedChange={(checked) => onEquipmentSubChange('hasWirelessMic', checked)}
                  />
                  <span className="ml-2">ไมค์ไร้สาย</span>
                </label>
                <label className="flex items-center">
                  <Checkbox
                    checked={equipment.hasBoomMic}
                    onCheckedChange={(checked) => onEquipmentSubChange('hasBoomMic', checked)}
                  />
                  <span className="ml-2">ไมค์บูม</span>
                </label>
                <label className="flex items-center">
                  <Checkbox
                    checked={equipment.hasSoundRecorder}
                    onCheckedChange={(checked) => onEquipmentSubChange('hasSoundRecorder', checked)}
                  />
                  <span className="ml-2">เครื่องบันทึกเสียง</span>
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="อุปกรณ์เสียงอื่นๆ"
                    value={equipment.otherSoundEquipment || ''}
                    onChange={(e) => onEquipmentDetailsChange('otherSoundEquipment', e.target.value)}
                    className="form-input w-full"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="inline-flex items-center">
              <Checkbox
                checked={equipment.lightingIncluded}
                onCheckedChange={(checked) => {
                  onEquipmentChange('lightingIncluded', checked);
                }}
              />
              <span className="ml-2">💡 เตรียมอุปกรณ์ไฟมาด้วย</span>
            </label>
            {equipment.lightingIncluded && (
              <div className="mt-2 pl-6">
                <input
                  type="text"
                  placeholder="รายละเอียดอุปกรณ์ไฟ"
                  value={equipment.lightingDetails || ''}
                  onChange={(e) => onEquipmentDetailsChange('lightingDetails', e.target.value)}
                  className="form-input w-full"
                />
              </div>
            )}
          </div>

          <div>
            <label className="inline-flex items-center">
              <Checkbox
                checked={equipment.computerIncluded}
                onCheckedChange={(checked) => {
                  onEquipmentChange('computerIncluded', checked);
                }}
              />
              <span className="ml-2">💻 เตรียมคอมพิวเตอร์ตัดต่อมาด้วย</span>
            </label>
            {equipment.computerIncluded && (
              <div className="mt-2 space-y-2 pl-6">
                <label className="flex items-center">
                  <Checkbox
                    checked={equipment.hasMacBook}
                    onCheckedChange={(checked) => onEquipmentSubChange('hasMacBook', checked)}
                  />
                  <span className="ml-2">แมคบุ๊ค</span>
                </label>
                <label className="flex items-center">
                  <Checkbox
                    checked={equipment.hasPC}
                    onCheckedChange={(checked) => onEquipmentSubChange('hasPC', checked)}
                  />
                  <span className="ml-2">พีซี/โน้ตบุ๊ค</span>
                </label>
                <label className="flex items-center">
                  <Checkbox
                    checked={equipment.hasSSD}
                    onCheckedChange={(checked) => onEquipmentSubChange('hasSSD', checked)}
                  />
                  <span className="ml-2">เอสเอสดี</span>
                </label>
                <label className="flex items-center">
                  <Checkbox
                    checked={equipment.hasHDD}
                    onCheckedChange={(checked) => onEquipmentSubChange('hasHDD', checked)}
                  />
                  <span className="ml-2">ฮาร์ดดิสก์</span>
                </label>
                <label className="flex items-center">
                  <Checkbox
                    checked={equipment.hasComputerMonitor}
                    onCheckedChange={(checked) => onEquipmentSubChange('hasComputerMonitor', checked)}
                  />
                  <span className="ml-2">จอมอนิเตอร์</span>
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="อุปกรณ์คอมพิวเตอร์อื่นๆ"
                    value={equipment.otherComputerEquipment || ''}
                    onChange={(e) => onEquipmentDetailsChange('otherComputerEquipment', e.target.value)}
                    className="form-input w-full"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Required Equipment Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">🏕️ อุปกรณ์ที่ต้องให้ค่ายเตรียมให้</h2>
          <p className="text-red-600 mb-6">** อุปกรณ์ที่ทางค่ายจัดเตรียมให้เป็นไปตามเงื่อนไขที่เหมาะสมกับสถานการณ์ **</p>
        <div className="space-y-4">
          <div>
            <label className="inline-flex items-center">
              <Checkbox
                checked={equipment.requireCamera}
                onCheckedChange={(checked) => {
                  onEquipmentChange('requireCamera', checked);
                }}
              />
              <span className="ml-2">📹 ต้องการให้เตรียมกล้องให้</span>
            </label>
            {equipment.requireCamera && (
              <div className="mt-2 space-y-2 pl-6">
                <label className="flex items-center">
                  <Checkbox
                    checked={equipment.requireCameraBody}
                    onCheckedChange={(checked) => onEquipmentSubChange('requireCameraBody', checked)}
                  />
                  <span className="ml-2">กล้อง</span>
                </label>
                <label className="flex items-center">
                  <Checkbox
                    checked={equipment.requireTripod}
                    onCheckedChange={(checked) => onEquipmentSubChange('requireTripod', checked)}
                  />
                  <span className="ml-2">ขาตั้งกล้อง</span>
                </label>
                <label className="flex items-center">
                  <Checkbox
                    checked={equipment.requireMonitor}
                    onCheckedChange={(checked) => onEquipmentSubChange('requireMonitor', checked)}
                  />
                  <span className="ml-2">จอมอนิเตอร์</span>
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="อุปกรณ์กล้องอื่นๆ ที่ต้องการ"
                    value={equipment.requiredCameraDetails || ''}
                    onChange={(e) => onEquipmentDetailsChange('requiredCameraDetails', e.target.value)}
                    className="form-input w-full"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="inline-flex items-center">
              <Checkbox
                checked={equipment.requireSound}
                onCheckedChange={(checked) => {
                  onEquipmentChange('requireSound', checked);
                }}
              />
              <span className="ml-2">🎤 ต้องการให้เตรียมอุปกรณ์เสียงให้</span>
            </label>
            {equipment.requireSound && (
              <div className="mt-2 space-y-2 pl-6">
                <label className="flex items-center">
                  <Checkbox
                    checked={equipment.requireShotgunMic}
                    onCheckedChange={(checked) => onEquipmentSubChange('requireShotgunMic', checked)}
                  />
                  <span className="ml-2">ไมค์ช็อตกัน</span>
                </label>
                <label className="flex items-center">
                  <Checkbox
                    checked={equipment.requireWirelessMic}
                    onCheckedChange={(checked) => onEquipmentSubChange('requireWirelessMic', checked)}
                  />
                  <span className="ml-2">ไมค์ไร้สาย</span>
                </label>
                <label className="flex items-center">
                  <Checkbox
                    checked={equipment.requireBoomMic}
                    onCheckedChange={(checked) => onEquipmentSubChange('requireBoomMic', checked)}
                  />
                  <span className="ml-2">ไมค์บูม</span>
                </label>
                <label className="flex items-center">
                  <Checkbox
                    checked={equipment.requireSoundRecorder}
                    onCheckedChange={(checked) => onEquipmentSubChange('requireSoundRecorder', checked)}
                  />
                  <span className="ml-2">เครื่องบันทึกเสียง</span>
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="อุปกรณ์เสียงอื่นๆ ที่ต้องการ"
                    value={equipment.requiredSoundDetails || ''}
                    onChange={(e) => onEquipmentDetailsChange('requiredSoundDetails', e.target.value)}
                    className="form-input w-full"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="inline-flex items-center">
              <Checkbox
                checked={equipment.requireLighting}
                onCheckedChange={(checked) => {
                  onEquipmentChange('requireLighting', checked);
                }}
              />
              <span className="ml-2">💡 ต้องการให้เตรียมอุปกรณ์ไฟให้</span>
            </label>
            {equipment.requireLighting && (
              <div className="mt-2 pl-6">
                <input
                  type="text"
                  placeholder="ระบุรายละเอียดอุปกรณ์ไฟที่ต้องการ"
                  value={equipment.requiredLightingDetails || ''}
                  onChange={(e) => onEquipmentDetailsChange('requiredLightingDetails', e.target.value)}
                  className="form-input w-full"
                />
              </div>
            )}
          </div>

          <div>
            <label className="inline-flex items-center">
              <Checkbox
                checked={equipment.requireComputer}
                onCheckedChange={(checked) => {
                  onEquipmentChange('requireComputer', checked);
                }}
              />
              <span className="ml-2">💻 ต้องการให้เตรียมคอมพิวเตอร์ให้</span>
            </label>
            {equipment.requireComputer && (
              <div className="mt-2 space-y-2 pl-6">
                <label className="flex items-center">
                  <Checkbox
                    checked={equipment.requireMacBook}
                    onCheckedChange={(checked) => onEquipmentSubChange('requireMacBook', checked)}
                  />
                  <span className="ml-2">แมคบุ๊ค</span>
                </label>
                <label className="flex items-center">
                  <Checkbox
                    checked={equipment.requirePC}
                    onCheckedChange={(checked) => onEquipmentSubChange('requirePC', checked)}
                  />
                  <span className="ml-2">พีซี/โน้ตบุ๊ค</span>
                </label>
                <label className="flex items-center">
                  <Checkbox
                    checked={equipment.requireSSD}
                    onCheckedChange={(checked) => onEquipmentSubChange('requireSSD', checked)}
                  />
                  <span className="ml-2">เอสเอสดี</span>
                </label>
                <label className="flex items-center">
                  <Checkbox
                    checked={equipment.requireHDD}
                    onCheckedChange={(checked) => onEquipmentSubChange('requireHDD', checked)}
                  />
                  <span className="ml-2">ฮาร์ดดิสก์</span>
                </label>
                <label className="flex items-center">
                  <Checkbox
                    checked={equipment.requireComputerMonitor}
                    onCheckedChange={(checked) => onEquipmentSubChange('requireComputerMonitor', checked)}
                  />
                  <span className="ml-2">จอมอนิเตอร์</span>
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="อุปกรณ์คอมพิวเตอร์อื่นๆ ที่ต้องการ"
                    value={equipment.requiredComputerDetails || ''}
                    onChange={(e) => onEquipmentDetailsChange('requiredComputerDetails', e.target.value)}
                    className="form-input w-full"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
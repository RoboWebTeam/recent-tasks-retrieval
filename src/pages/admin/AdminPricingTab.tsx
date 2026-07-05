import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { PLAN_PRICING_URL, ENERGY_PRICING_URL, unwrap, type PlanPrice, type EnergyPrice } from './adminTypes';

interface AdminPricingTabProps {
  adminKey: string;
}

export function AdminPricingTab({ adminKey }: AdminPricingTabProps) {
  const [plans, setPlans] = useState<PlanPrice[]>([]);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [energyPackages, setEnergyPackages] = useState<EnergyPrice[]>([]);
  const [energyEditValues, setEnergyEditValues] = useState<Record<string, string>>({});
  const [energyLoading, setEnergyLoading] = useState(true);
  const [energySaving, setEnergySaving] = useState(false);
  const [energySaved, setEnergySaved] = useState(false);
  const [energyErrorMsg, setEnergyErrorMsg] = useState('');

  const fetchPlans = () => {
    setLoading(true);
    fetch(PLAN_PRICING_URL)
      .then(r => r.json())
      .then(raw => {
        const d = unwrap(raw);
        const list = (d.plans as PlanPrice[]) || [];
        setPlans(list);
        const init: Record<string, string> = {};
        list.forEach(p => { init[p.plan_code] = String(p.price); });
        setEditValues(init);
      })
      .finally(() => setLoading(false));
  };

  const fetchEnergyPackages = () => {
    setEnergyLoading(true);
    fetch(ENERGY_PRICING_URL)
      .then(r => r.json())
      .then(raw => {
        const d = unwrap(raw);
        const list = (d.packages as EnergyPrice[]) || [];
        setEnergyPackages(list);
        const init: Record<string, string> = {};
        list.forEach(p => { init[p.code] = String(p.price); });
        setEnergyEditValues(init);
      })
      .finally(() => setEnergyLoading(false));
  };

  useEffect(() => { fetchPlans(); fetchEnergyPackages(); }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const payload = plans.map(p => ({ plan_code: p.plan_code, price: Number(editValues[p.plan_code]) }));
      const res = await fetch(PLAN_PRICING_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ plans: payload }),
      });
      const raw = await res.json();
      const d = unwrap(raw);
      if (!res.ok || d.error) {
        throw new Error((d.error as string) || 'Ошибка сохранения');
      }
      setPlans((d.plans as PlanPrice[]) || plans);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка сохранения');
    }
    setSaving(false);
  };

  const handleSaveEnergy = async () => {
    setEnergySaving(true);
    setEnergyErrorMsg('');
    setEnergySaved(false);
    try {
      const payload = energyPackages.map(p => ({ code: p.code, price: Number(energyEditValues[p.code]) }));
      const res = await fetch(ENERGY_PRICING_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ packages: payload }),
      });
      const raw = await res.json();
      const d = unwrap(raw);
      if (!res.ok || d.error) {
        throw new Error((d.error as string) || 'Ошибка сохранения');
      }
      setEnergyPackages((d.packages as EnergyPrice[]) || energyPackages);
      setEnergySaved(true);
      setTimeout(() => setEnergySaved(false), 2500);
    } catch (e) {
      setEnergyErrorMsg(e instanceof Error ? e.message : 'Ошибка сохранения');
    }
    setEnergySaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
        <Icon name="Loader" size={18} className="animate-spin" />
        Загрузка…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display font-bold text-lg">Цены тарифов «Профи»</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Одна карточка «Профи» на сайте — пользователь выбирает нужное количество запросов, цена подтягивается отсюда
            </p>
          </div>
          <Button size="sm" className="rounded-xl gap-1.5" disabled={saving} onClick={handleSave}>
            {saving ? <Icon name="Loader" size={14} className="animate-spin" /> : <Icon name="Save" size={14} />}
            Сохранить
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-destructive/10 text-destructive rounded-xl px-4 py-3 mb-4 text-sm">
            <Icon name="AlertCircle" size={15} /> {error}
          </div>
        )}
        {saved && (
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 rounded-xl px-4 py-3 mb-4 text-sm">
            <Icon name="CheckCircle" size={15} /> Цены сохранены
          </div>
        )}

        <div className="rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[420px]">
            <thead className="bg-secondary/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Тариф</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Запросов в месяц</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Цена, ₽/мес</th>
              </tr>
            </thead>
            <tbody>
              {plans.map(p => (
                <tr key={p.plan_code} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">Профи</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.requests}</td>
                  <td className="px-4 py-3">
                    <Input
                      type="number"
                      min={0}
                      value={editValues[p.plan_code] ?? ''}
                      onChange={e => setEditValues(prev => ({ ...prev, [p.plan_code]: e.target.value }))}
                      className="h-9 rounded-lg w-32"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display font-bold text-lg">Цены пакетов энергии</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Разовая докупка AI-запросов в личном кабинете — карточки на вкладке «Тариф»
            </p>
          </div>
          {energyLoading ? null : (
            <Button size="sm" className="rounded-xl gap-1.5" disabled={energySaving} onClick={handleSaveEnergy}>
              {energySaving ? <Icon name="Loader" size={14} className="animate-spin" /> : <Icon name="Save" size={14} />}
              Сохранить
            </Button>
          )}
        </div>

        {energyErrorMsg && (
          <div className="flex items-center gap-2 bg-destructive/10 text-destructive rounded-xl px-4 py-3 mb-4 text-sm">
            <Icon name="AlertCircle" size={15} /> {energyErrorMsg}
          </div>
        )}
        {energySaved && (
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 rounded-xl px-4 py-3 mb-4 text-sm">
            <Icon name="CheckCircle" size={15} /> Цены сохранены
          </div>
        )}

        {energyLoading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground gap-2">
            <Icon name="Loader" size={18} className="animate-spin" />
            Загрузка…
          </div>
        ) : (
          <div className="rounded-2xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[420px]">
              <thead className="bg-secondary/50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Пакет</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Запросов</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Цена, ₽</th>
                </tr>
              </thead>
              <tbody>
                {energyPackages.map(p => (
                  <tr key={p.code} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{p.code}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.requests}</td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        min={0}
                        value={energyEditValues[p.code] ?? ''}
                        onChange={e => setEnergyEditValues(prev => ({ ...prev, [p.code]: e.target.value }))}
                        className="h-9 rounded-lg w-32"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}